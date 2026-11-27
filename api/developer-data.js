import { requireServerClient } from './_lib/child-auth.js';
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
  const client = requireServerClient();

  switch (body.action) {
    case 'flags_push': {
      const { error } = await client.from('feature_flags').upsert({
        id: 'default',
        flags: body.flags && typeof body.flags === 'object' ? body.flags : {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      return json(res, 200, { success: true });
    }
    case 'flags_pull': {
      const { data, error } = await client.from('feature_flags').select('flags').eq('id', 'default').maybeSingle();
      if (error) throw new Error(error.message);
      return json(res, 200, { success: true, flags: flagsFromRow(data) });
    }
    case 'updates_push': {
      const updates = Array.isArray(body.updates) ? body.updates : [];
      for (const update of updates) {
        const { error } = await client.from('developer_updates').upsert(updateToRow(update), { onConflict: 'id' });
        if (error) throw new Error(error.message);
      }
      return json(res, 200, { success: true, count: updates.length });
    }
    case 'updates_pull': {
      const { data, error } = await client
        .from('developer_updates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return json(res, 200, { success: true, updates: (data || []).map(updateFromRow) });
    }
    case 'trash_push': {
      const entry = trashToRow(body.entry || {});
      const { error } = await client.from('developer_trash').upsert(entry, { onConflict: 'child_id' });
      if (error) throw new Error(error.message);
      return json(res, 200, { success: true });
    }
    case 'trash_pull': {
      const { data, error } = await client
        .from('developer_trash')
        .select('*')
        .order('deleted_at', { ascending: false });
      if (error) throw new Error(error.message);
      return json(res, 200, { success: true, entries: (data || []).map(trashFromRow) });
    }
    case 'trash_delete': {
      const { error } = await client.from('developer_trash').delete().eq('child_id', body.childId);
      if (error) throw new Error(error.message);
      return json(res, 200, { success: true });
    }
    default:
      return json(res, 400, { success: false, error: 'Unknown action' });
  }
};

export default withErrors(handler);
