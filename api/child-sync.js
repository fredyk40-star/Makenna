import {
  authorizedChildIds,
  getAccountRow,
  normalizeChildId,
  requireActiveChild,
  requireServerClient,
  syncPatch,
  validateChildId,
  timeOf,
  toClientAccount,
} from './_lib/child-auth.js';
import { verifySessionToken } from './_lib/developer-auth.js';
import { HttpError, json, readBody, requirePost, withErrors } from './_lib/http.js';

const tokenFor = (tokens, childId) => (
  tokens?.[childId] || tokens?.[normalizeChildId(childId)] || null
);

async function pull(client, body) {
  const childIds = authorizedChildIds(body.tokens);
  if (!childIds.length) return { accounts: [] };

  // A signed token is not enough: skip deleted accounts and devices signed out
  // after the token was issued rather than returning their protected data.
  const activeIds = [];
  for (const childId of childIds) {
    try {
      await requireActiveChild(client, tokenFor(body.tokens, childId), childId);
      activeIds.push(childId);
    } catch {
      // Revoked or deleted account: the device simply sees no cloud account.
    }
  }
  if (!activeIds.length) return { accounts: [] };

  const { data, error } = await client
    .from('child_accounts')
    .select('*')
    .in('child_id', activeIds)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);

  return { accounts: (data || []).map(toClientAccount) };
}

async function push(client, body) {
  const accounts = Array.isArray(body.accounts) ? body.accounts.slice(0, 200) : [];
  const tokens = body.tokens || {};

  // Reject the whole batch before writing anything if any device is unauthorised.
  for (const account of accounts) {
    await requireActiveChild(client, tokenFor(tokens, account?.childId), account?.childId);
  }

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
      console.error('Child sync push failed:', { childId, message: error.message });
      failures.push({ childId, error: 'Could not sync this account. Please try again.' });
    }
  }

  return { count: applied, skipped, failures };
}

async function softDelete(client, body) {
  const requestedId = normalizeChildId(body.childId);
  let childId;

  // A developer may delete any account from the dashboard. Otherwise the
  // request must carry a signed token issued when this device signed in.
  if (verifySessionToken(body.developerToken || body.sessionToken)) {
    if (!validateChildId(requestedId)) throw new HttpError(400, 'Invalid child ID.');
    childId = requestedId;
  } else {
    ({ childId } = await requireActiveChild(
      client,
      tokenFor(body.tokens, body.childId),
      body.childId,
    ));
  }

  const now = new Date().toISOString();
  const { error } = await client
    .from('child_accounts')
    .update({ deleted_at: now, token_revoked_at: now, updated_at: now })
    .eq('child_id', childId);
  if (error) throw new Error(error.message);
  return { childId };
}

async function restore(client, body) {
  if (!verifySessionToken(body.developerToken || body.sessionToken)) {
    throw new HttpError(401, 'Developer session is invalid. Please sign in again.');
  }
  const childId = normalizeChildId(body.childId);
  if (!validateChildId(childId)) throw new HttpError(400, 'Invalid child ID.');
  const row = await getAccountRow(client, childId);
  if (!row) throw new HttpError(404, 'Account not found.');

  const patch = syncPatch(body.account || {});
  patch.deleted_at = null;
  patch.token_revoked_at = null;
  const { error } = await client
    .from('child_accounts')
    .update(patch)
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
    case 'restore': {
      const result = await restore(client, body);
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
