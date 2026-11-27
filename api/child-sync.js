import {
  authorizedChildIds,
  getAccountRow,
  normalizeChildId,
  requireActiveChild,
  syncPatch,
  validateChildId,
  timeOf,
  toClientAccount,
} from './_lib/child-auth.js';
import { verifySessionToken } from './_lib/developer-auth.js';
import { requireStore, validOperationId } from './_lib/store.js';
import { HttpError, json, readBody, requirePost, withErrors } from './_lib/http.js';

const tokenFor = (tokens, childId) => (
  tokens?.[childId] || tokens?.[normalizeChildId(childId)] || null
);

async function replayedOperation(client, childId, operationId, action) {
  if (!operationId || !childId) return null;
  const row = await client.findSyncOperation(childId, operationId);
  if (!row || row.action !== action) return null;
  return row.response && typeof row.response === 'object' ? row.response : {};
}

async function rememberOperation(client, childId, operationId, action, response) {
  if (!operationId || !childId) return;
  await client.recordSyncOperation({
    child_id: childId,
    operation_id: operationId,
    action,
    response,
    created_at: new Date().toISOString(),
  });
}

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

  const rows = await client.listAccountsByIds(activeIds);
  return { accounts: (rows || []).map(toClientAccount) };
}

async function push(client, body) {
  const accounts = Array.isArray(body.accounts) ? body.accounts.slice(0, 200) : [];
  const tokens = body.tokens || {};
  const operationId = validOperationId(body.operationId);
  const replayChildId = accounts.length === 1 ? normalizeChildId(accounts[0]?.childId) : null;

  // A replay after the local success was not persisted must not re-apply the
  // write. The operation id is a client retry key, never a record version.
  if (operationId && replayChildId) {
    const replay = await replayedOperation(client, replayChildId, operationId, 'push');
    if (replay) return { ...replay, replayed: true };
  }

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
      await client.updateAccount(childId, syncPatch(account));
      applied += 1;
    } catch (error) {
      console.error('Child sync push failed:', { childId, message: error.message });
      failures.push({ childId, error: 'Could not sync this account. Please try again.' });
    }
  }

  const response = { count: applied, skipped, failures };
  if (!failures.length) {
    await rememberOperation(client, replayChildId, operationId, 'push', response);
  }
  return response;
}

async function softDelete(client, body) {
  const requestedId = normalizeChildId(body.childId);
  const operationId = validOperationId(body.operationId);

  const replay = await replayedOperation(client, requestedId, operationId, 'delete');
  if (replay) return { childId: requestedId, ...replay, replayed: true };

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
  await client.updateAccount(childId, {
    deleted_at: now,
    token_revoked_at: now,
    updated_at: now,
  });
  const response = { childId };
  await rememberOperation(client, childId, operationId, 'delete', response);
  return response;
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
  await client.updateAccount(childId, patch);
  return { childId };
}

async function adminList(client, body) {
  if (!verifySessionToken(body.developerToken || body.sessionToken)) {
    throw new HttpError(401, 'Developer session is invalid. Please sign in again.');
  }
  const rows = await client.listActiveAccounts();
  return { accounts: (rows || []).map(toClientAccount) };
}

const handler = async (req, res) => {
  requirePost(req, res);
  const body = readBody(req);
  const client = requireStore();

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
