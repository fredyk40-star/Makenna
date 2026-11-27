import { vi } from 'vitest';
import { hashCredential } from '../../api/_lib/child-auth.js';

const normalize = value => String(value || '').trim().toLowerCase();

/**
 * Stable in-memory replacement for /api/* used by client-service tests.
 * It mirrors the public contract of the serverless handlers (safe accounts,
 * device tokens, server-side hash verification) without a live database.
 */
export const apiState = {
  accounts: new Map(),
  requests: new Map(),
  verifications: new Map(),
  developerSession: 'developer-token',
  calls: [],
};

export function resetApiMock() {
  apiState.accounts.clear();
  apiState.requests.clear();
  apiState.verifications.clear();
  apiState.calls.length = 0;
}

const safeAccount = row => ({
  childId: row.child_id,
  fullName: row.full_name,
  pinSet: !!row.pin_set,
  passwordSet: !!row.password_set,
  parentEmail: row.parent_email || null,
  requiresCredentialReset: !!row.requires_credential_reset,
  avatar: row.avatar || 'default',
  createdAt: row.created_at,
  lastLogin: row.last_login,
  progress: row.progress || {},
  settings: row.settings || {},
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at || null,
  version: Number(row.version || 0),
});

const ok = data => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true, ...data }),
});

const fail = (error, status = 400) => ({
  ok: false,
  status,
  json: async () => ({ success: false, error }),
});

const requireDev = body => (
  body.developerToken === apiState.developerSession
  || body.sessionToken === apiState.developerSession
);

const requireChild = body => {
  const id = normalize(body.childId);
  const token = body.token || body.sessionToken;
  return token === `token-${id}` ? id : null;
};

const tokenFor = (tokens, childId) => {
  const id = normalize(childId);
  return tokens?.[childId] || tokens?.[id];
};

const dispatch = (endpoint, body) => {
  if (endpoint === 'child-auth') {
    if (body.action === 'register') {
      const childId = `kid${String(apiState.accounts.size + 20345635).slice(-8).padStart(8, '0')}`;
      const now = new Date().toISOString();
      const credential = body.pin ?? body.credential ?? body.password;
      const isPin = /^\d{4}$|^\d{8}$/.test(credential);
      const hash = hashCredential(credential);
      const row = {
        child_id: childId,
        full_name: body.fullName.trim(),
        pin_hash: isPin ? hash : null,
        pin_set: isPin,
        password_hash: isPin ? null : hash,
        password_set: !isPin,
        parent_email: normalize(body.parentEmail),
        temp_password_hash: null,
        temp_password_expires_at: null,
        requires_credential_reset: false,
        avatar: 'default',
        created_at: now,
        last_login: null,
        progress: {},
        settings: {},
        updated_at: now,
        version: 1,
      };
      apiState.accounts.set(childId, row);
      return ok({ account: safeAccount(row), token: `token-${childId}` });
    }

    if (body.action === 'login') {
      const id = normalize(body.childId);
      const row = apiState.accounts.get(id);
      const hash = hashCredential(body.credential);
      if (!row || row.deleted_at) return fail('Invalid Child ID or password. Please try again.', 401);

      const tempValid = !!(
        row.temp_password_hash === hash
        && row.temp_password_expires_at
        && Date.parse(row.temp_password_expires_at) > Date.now()
      );
      if (row.requires_credential_reset && !tempValid) {
        return fail(
          'A temporary password is active. Ask your parent to use it to set a new PIN or password.',
          403,
        );
      }

      const regularValid = (row.pin_set && row.pin_hash === hash)
        || (row.password_set && row.password_hash === hash);
      if (!tempValid && !regularValid) {
        return fail('Invalid Child ID or password. Please try again.', 401);
      }

      return ok({
        account: safeAccount(row),
        token: `token-${id}`,
        requiresCredentialReset: tempValid || !!row.requires_credential_reset,
      });
    }

    if (body.action === 'issue_temp_password') {
      if (!requireDev(body)) return fail('Developer session is invalid.', 401);
      const id = normalize(body.childId);
      const email = normalize(body.parentEmail);
      const row = apiState.accounts.get(id);
      if (!row || row.parent_email !== email) {
        return fail('No account was found for that Child ID and parent email.', 404);
      }
      const hasVerifiedRequest = Array.from(apiState.requests.values())
        .some(request => request.childId === id && request.parentEmail === email && request.parentVerified);
      if (!hasVerifiedRequest) {
        return fail('A verified recovery request is required before a temporary password can be issued.', 409);
      }

      const tempPassword = 'TempPassword1!';
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      row.temp_password_hash = hashCredential(tempPassword);
      row.temp_password_expires_at = expiresAt;
      row.requires_credential_reset = true;
      return ok({
        childId: id,
        fullName: row.full_name,
        parentEmail: row.parent_email,
        tempPassword,
        expiresAt,
      });
    }

    if (body.action === 'reset_credential') {
      const id = requireChild(body);
      if (!id) return fail('This device is no longer authorised.', 401);
      const row = apiState.accounts.get(id);
      if (!row || !row.requires_credential_reset) return fail('No credential reset is pending.', 409);

      const hash = hashCredential(body.newCredential ?? body.credential);
      if (body.type === 'password') {
        row.password_hash = hash;
        row.password_set = true;
        row.pin_hash = null;
        row.pin_set = false;
      } else {
        row.pin_hash = hash;
        row.pin_set = true;
        row.password_hash = null;
        row.password_set = false;
      }
      row.temp_password_hash = null;
      row.temp_password_expires_at = null;
      row.requires_credential_reset = false;
      return ok({ account: safeAccount(row), credentialType: body.type || 'pin' });
    }

    if (body.action === 'change_credential') {
      const id = requireChild(body);
      if (!id) return fail('This device is no longer authorised.', 401);
      const row = apiState.accounts.get(id);
      if (!row || row.deleted_at) return fail('Account not found.', 404);

      const currentHash = hashCredential(body.currentCredential ?? body.currentPin);
      const tempValid = !!(
        row.temp_password_hash === currentHash
        && row.temp_password_expires_at
        && Date.parse(row.temp_password_expires_at) > Date.now()
      );
      const regularValid = (row.pin_set && row.pin_hash === currentHash)
        || (row.password_set && row.password_hash === currentHash);
      if (!tempValid && !regularValid) {
        return fail('Incorrect current PIN or password. Please try again.', 401);
      }

      const newCredential = body.newCredential ?? body.credential;
      const isPin = body.type !== 'password';
      if (isPin && !/^\d{4}$|^\d{8}$/.test(newCredential)) {
        return fail('PIN must be 4 or 8 digits.', 400);
      }
      if (!isPin && (typeof newCredential !== 'string' || newCredential.length < 8)) {
        return fail('Password must be at least 8 characters.', 400);
      }

      const hash = hashCredential(newCredential);
      if (isPin) {
        row.pin_hash = hash;
        row.pin_set = true;
        row.password_hash = null;
        row.password_set = false;
      } else {
        row.password_hash = hash;
        row.password_set = true;
        row.pin_hash = null;
        row.pin_set = false;
      }
      row.temp_password_hash = null;
      row.temp_password_expires_at = null;
      row.requires_credential_reset = false;
      row.updated_at = new Date().toISOString();
      row.version = Number(row.version || 0) + 1;
      return ok({
        account: safeAccount(row),
        credentialType: isPin ? 'pin' : 'password',
        token: `token-${id}`,
      });
    }

    if (body.action === 'verify_pin') {
      const id = requireChild(body);
      if (!id) return fail('This device is no longer authorised.', 401);
      const row = apiState.accounts.get(id);
      const hash = hashCredential(body.pin);
      return ok({
        valid: !!row && ((row.pin_set && row.pin_hash === hash)
          || (row.password_set && row.password_hash === hash)),
      });
    }

    return fail('Unknown action');
  }

  if (endpoint === 'child-sync') {
    const tokens = body.tokens || {};
    const authorized = Object.entries(tokens)
      .filter(([id, token]) => token === `token-${normalize(id)}`)
      .map(([id]) => normalize(id));

    if (body.action === 'pull') {
      return ok({
        accounts: Array.from(apiState.accounts.values())
          .filter(row => authorized.includes(row.child_id) && !row.deleted_at)
          .map(safeAccount),
      });
    }

    if (body.action === 'push') {
      const failures = [];
      for (const account of body.accounts || []) {
        const id = normalize(account.childId);
        const row = apiState.accounts.get(id);
        if (!authorized.includes(id) || !row || row.deleted_at) {
          failures.push({ childId: id, error: 'Account not found in the cloud.' });
          continue;
        }
        if (Date.parse(account.updatedAt) > Date.parse(row.updated_at)) {
          row.full_name = account.fullName;
          row.avatar = account.avatar;
          row.progress = account.progress || {};
          row.settings = account.settings || {};
          row.updated_at = account.updatedAt;
          row.version = account.version;
        }
      }
      return ok({
        count: (body.accounts || []).length - failures.length,
        skipped: 0,
        failures,
      });
    }

    if (body.action === 'delete') {
      const id = requireDev(body)
        ? normalize(body.childId)
        : requireChild({
          childId: body.childId,
          token: tokenFor(tokens, body.childId),
        });
      if (!id || !/^kid[\d-]+$/i.test(id)) {
        return fail('This device is no longer authorised.', 401);
      }
      const row = apiState.accounts.get(id);
      if (row) row.deleted_at = new Date().toISOString();
      return ok({ childId: id });
    }

    if (body.action === 'restore') {
      if (!requireDev(body)) return fail('Developer session is invalid.', 401);
      const id = normalize(body.childId);
      const row = apiState.accounts.get(id);
      if (!row) return fail('Account not found.', 404);
      row.deleted_at = null;
      row.progress = body.account?.progress || row.progress;
      row.settings = body.account?.settings || row.settings;
      row.updated_at = body.account?.updatedAt || new Date().toISOString();
      row.version = body.account?.version || row.version;
      return ok({ childId: id });
    }

    if (body.action === 'admin_list') {
      if (!requireDev(body)) return fail('Developer session is invalid.', 401);
      return ok({ accounts: Array.from(apiState.accounts.values()).map(safeAccount) });
    }

    return fail('Unknown action');
  }

  if (endpoint === 'support') {
    if (body.action === 'send_verification') {
      const id = normalize(body.childId);
      const email = normalize(body.parentEmail);
      const row = apiState.accounts.get(id);
      const response = { message: 'If those details match an account, a code has been sent.' };
      if (row && row.parent_email === email && !row.deleted_at) {
        const code = '123456';
        apiState.verifications.set(`${id}:${email}`, code);
        response.devCode = code;
      }
      return ok(response);
    }

    if (body.action === 'submit') {
      const id = normalize(body.childId);
      const email = normalize(body.parentEmail);
      const row = apiState.accounts.get(id);
      const placeholder = {
        id: `request-${apiState.requests.size + 1}`,
        childId: id,
        parentEmail: email,
        message: body.message,
        status: 'open',
        developerNote: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // A non-matching identity never receives a code, so it fails with the
      // same generic error as a wrong code instead of revealing account state.
      if (!row || row.parent_email !== email || row.deleted_at
        || apiState.verifications.get(`${id}:${email}`) !== String(body.verificationCode)) {
        return fail('That verification code is invalid or has expired. Request a new one.', 400);
      }
      apiState.verifications.delete(`${id}:${email}`);

      const now = new Date().toISOString();
      const request = {
        ...placeholder,
        id: `request-${apiState.requests.size + 1}`,
        parentEmail: row.parent_email,
        parentVerified: true,
        createdAt: now,
        updatedAt: now,
      };
      apiState.requests.set(request.id, request);
      return ok({ request });
    }

    if (!requireDev(body)) return fail('Developer session is invalid.', 401);

    if (body.action === 'list') return ok({ requests: Array.from(apiState.requests.values()) });

    if (body.action === 'update') {
      const request = apiState.requests.get(body.id);
      if (!request) return fail('Support request not found.', 404);
      request.status = body.status;
      request.developerNote = body.developerNote || request.developerNote;
      request.updatedAt = new Date().toISOString();
      return ok({ id: request.id });
    }

    if (body.action === 'delete') {
      apiState.requests.delete(body.id);
      return ok({ id: body.id });
    }

    if (body.action === 'sync') {
      (body.requests || []).forEach(request => apiState.requests.set(request.id, request));
      return ok({ count: (body.requests || []).length });
    }

    return fail('Unknown action');
  }

  if (endpoint === 'developer-data') {
    if (!requireDev(body)) return fail('Developer session is invalid.', 401);
    return ok({});
  }

  return fail('Unknown endpoint');
};

/** Called from test setup before each test so spies survive restoreMocks. */
export function installApiMock() {
  resetApiMock();
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
    const endpoint = String(url).replace(/^\/api\//, '');
    let body = {};
    try {
      body = JSON.parse(options?.body || '{}');
    } catch {
      // Keep the empty object; handlers return a clear validation error.
    }
    apiState.calls.push({ endpoint, body });
    return dispatch(endpoint, body);
  });
  return apiState;
}
