import crypto from 'node:crypto';
import {
  getAccountRow,
  normalizeChildId,
  requireServerClient,
  validateEmail,
} from './_lib/child-auth.js';
import { verifySessionToken } from './_lib/developer-auth.js';
import { HttpError, json, readBody, requirePost, withErrors } from './_lib/http.js';

const MAX_MESSAGE_LENGTH = 1000;
const ALLOWED_STATUS = ['open', 'reviewing', 'resolved'];

const toClientRequest = (row) => ({
  id: row.id,
  childId: row.child_id,
  parentEmail: row.parent_email,
  message: row.message,
  status: row.status || 'open',
  developerNote: row.developer_note || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at || row.created_at,
});

const requireDeveloper = (body) => {
  if (!verifySessionToken(body.developerToken || body.sessionToken)) {
    throw new HttpError(401, 'Developer session is invalid. Please sign in again.');
  }
};

const validateMessage = (message) => {
  const trimmed = typeof message === 'string' ? message.trim() : '';
  if (trimmed.length < 5 || trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, `Please write a short message (5-${MAX_MESSAGE_LENGTH} characters).`);
  }
  return trimmed;
};

async function submit(client, body) {
  const childId = normalizeChildId(body.childId);
  const parentEmail = typeof body.parentEmail === 'string' ? body.parentEmail.trim().toLowerCase() : '';
  const message = validateMessage(body.message);

  if (!childId || !validateEmail(parentEmail)) {
    throw new HttpError(400, 'Enter a valid Child ID and parent email.');
  }

  // Identity is checked here against the server-side row. The browser never
  // downloads account hashes or the full account table to perform this check.
  const account = await getAccountRow(client, childId);
  if (!account || account.deleted_at || !account.parent_email
    || account.parent_email.toLowerCase() !== parentEmail) {
    throw new HttpError(404, 'No account was found with that Child ID and parent email. Check both and try again.');
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from('support_requests')
    .insert({
      id: crypto.randomUUID(),
      child_id: account.child_id,
      parent_email: parentEmail,
      message,
      status: 'open',
      developer_note: '',
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  return { request: toClientRequest(data) };
}

async function list(client) {
  const { data, error } = await client
    .from('support_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { requests: (data || []).map(toClientRequest) };
}

async function update(client, body) {
  if (!ALLOWED_STATUS.includes(body.status)) {
    throw new HttpError(400, `Unsupported status: ${body.status}`);
  }
  const { error } = await client
    .from('support_requests')
    .update({
      status: body.status,
      developer_note: typeof body.developerNote === 'string' ? body.developerNote.slice(0, 1000) : '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id);
  if (error) throw new Error(error.message);
  return { id: body.id };
}

async function remove(client, body) {
  const { error } = await client.from('support_requests').delete().eq('id', body.id);
  if (error) throw new Error(error.message);
  return { id: body.id };
}

async function syncToCloud(client, body) {
  const requests = Array.isArray(body.requests) ? body.requests.slice(0, 500) : [];
  if (!requests.length) return { count: 0 };

  const rows = requests.map((request) => ({
    id: request.id,
    child_id: request.childId,
    parent_email: request.parentEmail,
    message: validateMessage(request.message),
    status: ALLOWED_STATUS.includes(request.status) ? request.status : 'open',
    developer_note: request.developerNote || '',
    created_at: request.createdAt || new Date().toISOString(),
    updated_at: request.updatedAt || new Date().toISOString(),
  }));

  const { error } = await client
    .from('support_requests')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  return { count: rows.length };
}

const handler = async (req, res) => {
  requirePost(req, res);
  const body = readBody(req);
  const client = requireServerClient();

  switch (body.action) {
    case 'submit': {
      const result = await submit(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'list': {
      requireDeveloper(body);
      const result = await list(client);
      return json(res, 200, { success: true, ...result });
    }
    case 'update': {
      requireDeveloper(body);
      const result = await update(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'delete': {
      requireDeveloper(body);
      const result = await remove(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'sync': {
      requireDeveloper(body);
      const result = await syncToCloud(client, body);
      return json(res, 200, { success: true, ...result });
    }
    default:
      return json(res, 400, { success: false, error: 'Unknown action' });
  }
};

export default withErrors(handler);
