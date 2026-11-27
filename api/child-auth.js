import {
  clearFailures,
  createChildToken,
  createUniqueChildId,
  getAccountRow,
  hashCredentialStrong,
  hasVerifiedRecoveryRequest,
  isRateLimited,
  newTemporaryPassword,
  normalizeChildId,
  recordFailure,
  requireActiveChild,
  tempPasswordExpiry,
  toClientAccount,
  upgradeCredential,
  validateChildId,
  validateEmail,
  validateName,
  validatePassword,
  validatePin,
  verifyStoredCredential,
} from './_lib/child-auth.js';
import { verifySessionToken } from './_lib/developer-auth.js';
import { requireStore } from './_lib/store.js';
import { HttpError as ApiError, json, readBody, requirePost, withErrors } from './_lib/http.js';

const VERIFIED_REQUEST_WINDOW_MS = 24 * 60 * 60 * 1000;

const registerFailure = async (req, client, childId) => {
  await recordFailure(req, childId, client);
  if (await isRateLimited(req, childId, client)) {
    throw new ApiError(429, 'Too many attempts. Please wait 15 minutes and try again.');
  }
};

const requireCredential = (credential) => {
  if (typeof credential !== 'string' || credential.length < 4 || credential.length > 128) {
    throw new ApiError(400, 'Enter a valid PIN or password.');
  }
  return credential;
};

const requireDeveloper = (token) => {
  const session = verifySessionToken(token);
  if (!session) throw new ApiError(401, 'Developer session is invalid. Please sign in again.');
  return session;
};

async function register(client, body) {
  const { fullName, parentEmail } = body;
  const credential = body.credential || body.password || body.pin;
  const isPin = validatePin(credential);

  if (!validateName(fullName)) throw new ApiError(400, 'Please enter a valid name (1-50 characters).');
  if (!validatePin(credential) && !validatePassword(credential)) {
    throw new ApiError(400, 'Enter a valid PIN (4 or 8 digits) or password (at least 8 characters).');
  }
  if (!validateEmail(parentEmail)) {
    throw new ApiError(400, 'A parent email is required so this account can be recovered.');
  }

  const childId = await createUniqueChildId(client);
  const now = new Date().toISOString();

  const data = await client.insertAccount({
    child_id: childId,
    full_name: fullName.trim(),
    pin_hash: isPin ? hashCredentialStrong(credential) : null,
    pin_set: isPin,
    password_hash: isPin ? null : hashCredentialStrong(credential),
    password_set: !isPin,
    parent_email: parentEmail.trim().toLowerCase(),
    temp_password_hash: null,
    temp_password_expires_at: null,
    requires_credential_reset: false,
    avatar: 'default',
    created_at: now,
    last_login: null,
    progress: {},
    settings: {},
    updated_at: now,
    deleted_at: null,
    token_revoked_at: null,
    version: 1,
  });

  return {
    account: toClientAccount(data),
    token: createChildToken(childId),
  };
}

async function login(req, client, body) {
  const childId = normalizeChildId(body.childId);
  const credential = requireCredential(body.credential);

  if (!validateChildId(childId)) {
    throw new ApiError(400, 'Enter a valid Child ID.');
  }
  if (await isRateLimited(req, childId, client)) {
    throw new ApiError(429, 'Too many attempts. Please wait 15 minutes and try again.');
  }

  const row = await getAccountRow(client, childId);
  if (!row || row.deleted_at) {
    await registerFailure(req, client, childId);
    throw new ApiError(401, 'Invalid Child ID or password. Please try again.');
  }

  const temp = verifyStoredCredential(credential, row.temp_password_hash);
  const tempValid = !!(
    temp.valid
    && row.temp_password_expires_at
    && Date.parse(row.temp_password_expires_at) > Date.now()
  );

  if (row.requires_credential_reset && !tempValid) {
    throw new ApiError(403, 'A temporary password is active. Ask your parent to use it to set a new PIN or password.');
  }

  const password = verifyStoredCredential(credential, row.password_hash);
  const pin = verifyStoredCredential(credential, row.pin_hash);
  const regularValid = (!!row.password_set && password.valid) || (!!row.pin_set && pin.valid);

  if (!tempValid && !regularValid) {
    await registerFailure(req, client, childId);
    throw new ApiError(401, 'Invalid Child ID or password. Please try again.');
  }

  await clearFailures(req, childId, client);

  // Migrate legacy SHA-256 hashes on the first successful use of a credential.
  const upgrades = [];
  if (tempValid && temp.needsUpgrade) upgrades.push(['temp_password_hash', credential]);
  if (row.password_set && password.valid && password.needsUpgrade) upgrades.push(['password_hash', credential]);
  if (row.pin_set && pin.valid && pin.needsUpgrade) upgrades.push(['pin_hash', credential]);
  await Promise.all(upgrades.map(([field, value]) => upgradeCredential(client, childId, field, value)));

  const now = new Date().toISOString();
  await client.updateAccount(childId, { last_login: now, updated_at: now });

  return {
    account: toClientAccount({ ...row, last_login: now, updated_at: now }),
    token: createChildToken(childId),
    requiresCredentialReset: tempValid || !!row.requires_credential_reset,
  };
}

async function requireVerifiedRecoveryRequest(client, childId, parentEmail) {
  const verified = await hasVerifiedRecoveryRequest(
    client,
    childId,
    parentEmail,
    VERIFIED_REQUEST_WINDOW_MS,
  );
  if (!verified) {
    throw new ApiError(409, 'A verified recovery request is required before a temporary password can be issued.');
  }
}

async function issueTemporaryPassword(req, client, body) {
  requireDeveloper(body.developerToken || body.sessionToken);
  const childId = normalizeChildId(body.childId);
  const parentEmail = typeof body.parentEmail === 'string' ? body.parentEmail.trim().toLowerCase() : '';

  if (!validateChildId(childId) || !validateEmail(parentEmail)) {
    throw new ApiError(400, 'Enter a valid Child ID and parent email.');
  }
  if (await isRateLimited(req, parentEmail, client, 'recovery')) {
    throw new ApiError(429, 'Too many recovery requests. Please wait 15 minutes and try again.');
  }

  const row = await getAccountRow(client, childId);
  if (!row || row.deleted_at || !row.parent_email || row.parent_email.toLowerCase() !== parentEmail) {
    await recordFailure(req, parentEmail, client, 'recovery');
    throw new ApiError(404, 'No account was found for that Child ID and parent email.');
  }
  await requireVerifiedRecoveryRequest(client, childId, parentEmail);

  const tempPassword = newTemporaryPassword();
  const expiresAt = tempPasswordExpiry();
  await client.updateAccount(childId, {
    temp_password_hash: hashCredentialStrong(tempPassword),
    temp_password_expires_at: expiresAt,
    requires_credential_reset: true,
    token_revoked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await clearFailures(req, parentEmail, client, 'recovery');
  return {
    childId: row.child_id,
    fullName: row.full_name,
    parentEmail: row.parent_email,
    tempPassword,
    expiresAt,
  };
}

async function resetCredential(client, body) {
  const { childId } = await requireActiveChild(
    client,
    body.token || body.sessionToken,
    body.childId,
  );
  const type = body.type === 'password' ? 'password' : 'pin';
  const credential = requireCredential(body.newCredential ?? body.credential);

  if (type === 'password' && !validatePassword(credential)) {
    throw new ApiError(400, 'Password must be between 8 and 128 characters.');
  }
  if (type === 'pin' && !validatePin(credential)) {
    throw new ApiError(400, 'PIN must be 4 or 8 digits.');
  }

  const row = await getAccountRow(client, childId);
  if (!row || row.deleted_at) throw new ApiError(404, 'Account not found. Please log in again.');
  if (!row.requires_credential_reset) {
    throw new ApiError(409, 'No credential reset is pending for this account.');
  }

  const hash = hashCredentialStrong(credential);
  const updates = type === 'password'
    ? { password_hash: hash, password_set: true, pin_hash: null, pin_set: false }
    : { pin_hash: hash, pin_set: true, password_hash: null, password_set: false };

  await client.updateAccount(childId, {
    ...updates,
    temp_password_hash: null,
    temp_password_expires_at: null,
    requires_credential_reset: false,
    updated_at: new Date().toISOString(),
  });

  return {
    account: toClientAccount({
      ...row,
      ...updates,
      temp_password_hash: null,
      temp_password_expires_at: null,
      requires_credential_reset: false,
    }),
    credentialType: type,
  };
}

async function verifyPin(req, client, body) {
  const { childId } = await requireActiveChild(
    client,
    body.token || body.sessionToken,
    body.childId,
  );
  if (await isRateLimited(req, childId, client)) {
    throw new ApiError(429, 'Too many attempts. Please wait 15 minutes and try again.');
  }
  const pin = requireCredential(body.pin);
  const row = await getAccountRow(client, childId);
  if (!row || row.deleted_at) return { valid: false };

  const password = verifyStoredCredential(pin, row.password_hash);
  const legacyPin = verifyStoredCredential(pin, row.pin_hash);
  const valid = (!!row.password_set && password.valid) || (!!row.pin_set && legacyPin.valid);

  if (valid) {
    await clearFailures(req, childId, client);
    const upgrades = [];
    if (row.password_set && password.valid && password.needsUpgrade) upgrades.push(['password_hash', pin]);
    if (row.pin_set && legacyPin.valid && legacyPin.needsUpgrade) upgrades.push(['pin_hash', pin]);
    await Promise.all(upgrades.map(([field, value]) => upgradeCredential(client, childId, field, value)));
  } else {
    await recordFailure(req, childId, client);
  }
  return { valid };
}

const handler = async (req, res) => {
  requirePost(req, res);
  const body = readBody(req);
  const client = requireStore();

  switch (body.action) {
    case 'register': {
      const result = await register(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'login': {
      const result = await login(req, client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'issue_temp_password': {
      const result = await issueTemporaryPassword(req, client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'reset_credential': {
      const result = await resetCredential(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'verify_pin': {
      const result = await verifyPin(req, client, body);
      return json(res, 200, { success: true, ...result });
    }
    default:
      return json(res, 400, { success: false, error: 'Unknown action' });
  }
};

export default withErrors(handler);
