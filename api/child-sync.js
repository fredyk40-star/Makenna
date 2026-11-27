import {
  authorizedChildIds,
  getAccountRow,
  normalizeChildId,
  requireChildToken,
  requireServerClient,
  syncPatch,
  timeOf,
  toClientAccount,
} from './_lib/child-auth.js';
import { verifySessionToken } from './_lib/developer-auth.js';
import { HttpError, json, readBody, requirePost, withErrors } from './_lib/http.js';

async function pull(client, body) {
  const childIds = authorizedChildIds(body.tokens);
  if (!childIds.length) return { accounts: [] };

  const { data, error } = await client
    .from('child_accounts')
    .select('*')
    .in('child_id', childIds)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);

  return { accounts: (data || []).map(toClientAccount) };
}

async function push(client, body) {
  const accounts = Array.isArray(body.accounts) ? body.accounts.slice(0, 200) : [];
  const tokens = body.tokens || {};

  // Reject the whole batch before writing anything if any device is unauthorised.
  const tokenFor = childId => tokens[childId] || tokens[normalizeChildId(childId)];
  accounts.forEach((account) => {
    requireChildToken(tokenFor(account?.childId), account?.childId);
  });

  const failures = [];
  let applied = 0;
  let skipped = 0;

  for (const account of accounts) {
    const childId = normalizeChildId(account.childId);
    try {
      const row = await getAccountRow(client, childId);
      if (!row || row.deleted_at) {
        failures.push({ childId, error: 'Account not found in the cloud. Register it again.' });
        continue;
      }
      if (timeOf(account.updatedAt) <= timeOf(row.updated_at)) {
        skipped += 1;
        continue;
      }
      const { error } = await client
        .from('child_accounts')
        .update(syncPatch(account))
        .eq('child_id', childId);
      if (error) throw new Error(error.message);
      applied += 1;
    } catch (error) {
      failures.push({ childId, error: error.message });
    }
  }

  return { count: applied, skipped, failures };
}

async function softDelete(client, body) {
  const tokens = body.tokens || {};
  const token = tokens[body.childId] || tokens[normalizeChildId(body.childId)];
  const childId = requireChildToken(token, body.childId);
  const { error } = await client
    .from('child_accounts')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('child_id', childId);
  if (error) throw new Error(error.message);
  return { childId };
}

async function adminList(client, body) {
  if (!verifySessionToken(body.developerToken || body.sessionToken)) {
    throw new HttpError(401, 'Developer session is invalid. Please sign in again.');
  }
  const { data, error } = await client
    .from('child_accounts')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { accounts: (data || []).map(toClientAccount) };
}

const handler = async (req, res) => {
  requirePost(req, res);
  const body = readBody(req);
  const client = requireServerClient();

  switch (body.action) {
    case 'pull': {
      const result = await pull(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'push': {
      const result = await push(client, body);
      return json(res, 200, { success: result.failures.length === 0, ...result });
    }
    case 'delete': {
      const result = await softDelete(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'admin_list': {
      const result = await adminList(client, body);
      return json(res, 200, { success: true, ...result });
    }
    default:
      return json(res, 400, { success: false, error: 'Unknown action' });
  }
};

export default withErrors(handler);
