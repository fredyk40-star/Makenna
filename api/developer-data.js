import { requireStore } from './_lib/store.js';
import { verifySessionToken } from './_lib/developer-auth.js';
import { HttpError, json, readBody, requirePost, withErrors } from './_lib/http.js';

const requireDeveloper = (body) => {
  if (!verifySessionToken(body.developerToken || body.sessionToken)) {
    throw new HttpError(401, 'Developer session is invalid. Please sign in again.');
  }
};

const flagsFromRow = (row) => ({ ...(row?.flags || {}) });

const updateFromRow = (row) => ({
  id: row.id,
  version: row.version,
  type: row.type || 'feature',
  changelog: row.changelog || '',
  target: row.target || 'all',
  targetIds: row.target_ids || [],
  previewChildren: row.preview_children || [],
  status: row.status || 'preview',
  timestamp: row.created_at,
});

const updateToRow = (update) => ({
  id: update.id,
  version: update.version,
  type: update.type || 'feature',
  changelog: update.changelog || '',
  target: update.target || 'all',
  target_ids: Array.isArray(update.targetIds) ? update.targetIds : [],
  preview_children: Array.isArray(update.previewChildren) ? update.previewChildren : [],
  status: update.status || 'preview',
  created_at: update.timestamp || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const trashFromRow = (row) => ({
  childId: row.child_id,
  fullName: row.full_name,
  avatar: row.avatar || 'default',
  progress: row.progress || {},
  settings: row.settings || {},
  createdAt: row.created_at,
  deletedAt: row.deleted_at,
});

const trashToRow = (entry) => ({
  child_id: entry.childId,
  full_name: entry.fullName,
  avatar: entry.avatar || 'default',
  progress: entry.progress || {},
  settings: entry.settings || {},
  created_at: entry.createdAt || new Date().toISOString(),
  deleted_at: entry.deletedAt || new Date().toISOString(),
});

const handler = async (req, res) => {
  requirePost(req, res);
  const body = readBody(req);
  requireDeveloper(body);
  const client = requireStore();

  switch (body.action) {
    case 'flags_push': {
      await client.upsertFeatureFlags({
        id: 'default',
        flags: body.flags && typeof body.flags === 'object' ? body.flags : {},
        updated_at: new Date().toISOString(),
      });
      return json(res, 200, { success: true });
    }
    case 'flags_pull': {
      const row = await client.findFeatureFlags();
      return json(res, 200, { success: true, flags: flagsFromRow(row) });
    }
    case 'updates_push': {
      const updates = Array.isArray(body.updates) ? body.updates : [];
      await client.upsertDeveloperUpdates(updates.map(updateToRow));
      return json(res, 200, { success: true, count: updates.length });
    }
    case 'updates_pull': {
      const rows = await client.listDeveloperUpdates();
      return json(res, 200, { success: true, updates: (rows || []).map(updateFromRow) });
    }
    case 'trash_push': {
      await client.upsertDeveloperTrash(trashToRow(body.entry || {}));
      return json(res, 200, { success: true });
    }
    case 'trash_pull': {
      const rows = await client.listDeveloperTrash();
      return json(res, 200, { success: true, entries: (rows || []).map(trashFromRow) });
    }
    case 'trash_delete': {
      await client.deleteDeveloperTrash(body.childId);
      return json(res, 200, { success: true });
    }
    default:
      return json(res, 400, { success: false, error: 'Unknown action' });
  }
};

export default withErrors(handler);
