import {
  clearFailures,
  createChildToken,
  createUniqueChildId,
  getAccountRow,
  hashCredential,
  isRateLimited,
  newTemporaryPassword,
  normalizeChildId,
  recordFailure,
  requireChildToken,
  requireServerClient,
  safeEqual,
  tempPasswordExpiry,
  toClientAccount,
  validateChildId,
  validateEmail,
  validateName,
  validatePassword,
  validatePin,
} from './_lib/child-auth.js';
import { verifySessionToken } from './_lib/developer-auth.js';
import { HttpError as ApiError, json, readBody, requirePost, withErrors } from './_lib/http.js';

const registerFailure = (req, childId) => {
  try {
    recordFailure(req, childId);
  } catch (error) {
    if (error.status === 429) throw error;
  }
  if (isRateLimited(req, childId)) {
    throw new ApiError(429, 'Too many attempts. Please wait a few minutes and try again.');
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
  const { fullName, pin, parentEmail } = body;
  if (!validateName(fullName)) throw new ApiError(400, 'Please enter a valid name (1-50 characters).');
  if (!validatePin(pin)) throw new ApiError(400, 'PIN must be 4 or 8 digits.');
  if (!validateEmail(parentEmail)) {
    throw new ApiError(400, 'A parent email is required so this account can be recovered.');
  }

  const childId = await createUniqueChildId(client);
  const now = new Date().toISOString();
  const passwordHash = hashCredential(pin);

  const { data, error } = await client
    .from('child_accounts')
    .insert({
      child_id: childId,
      full_name: fullName.trim(),
      pin_hash: passwordHash,
      pin_set: true,
      password_hash: null,
      password_set: false,
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
      version: 1,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
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
  if (isRateLimited(req, childId)) {
    throw new ApiError(429, 'Too many attempts. Please wait a few minutes and try again.');
  }

  const row = await getAccountRow(client, childId);
  if (!row || row.deleted_at) {
    registerFailure(req, childId);
    throw new ApiError(401, 'Invalid Child ID or password. Please try again.');
  }

  const hash = hashCredential(credential);
  const tempValid = !!(
    row.temp_password_hash
    && safeEqual(row.temp_password_hash, hash)
    && row.temp_password_expires_at
    && Date.parse(row.temp_password_expires_at) > Date.now()
  );

  if (row.requires_credential_reset && !tempValid) {
    throw new ApiError(403, 'A temporary password is active. Ask your parent to use it to set a new PIN or password.');
  }

  const regularValid = (
    (!!row.password_set && safeEqual(row.password_hash, hash))
    || (!!row.pin_set && safeEqual(row.pin_hash, hash))
  );

  if (!tempValid && !regularValid) {
    registerFailure(req, childId);
    throw new ApiError(401, 'Invalid Child ID or password. Please try again.');
  }

  clearFailures(req, childId);
  const now = new Date().toISOString();
  const { error } = await client
    .from('child_accounts')
    .update({ last_login: now, updated_at: now })
    .eq('child_id', childId);
  if (error) throw new Error(error.message);

  return {
    account: toClientAccount({ ...row, last_login: now, updated_at: now }),
    token: createChildToken(childId),
    requiresCredentialReset: tempValid || !!row.requires_credential_reset,
  };
}

async function issueTemporaryPassword(client, body) {
  requireDeveloper(body.developerToken || body.sessionToken);
  const childId = normalizeChildId(body.childId);
  const parentEmail = typeof body.parentEmail === 'string' ? body.parentEmail.trim().toLowerCase() : '';

  if (!validateChildId(childId) || !validateEmail(parentEmail)) {
    throw new ApiError(400, 'Enter a valid Child ID and parent email.');
  }

  const row = await getAccountRow(client, childId);
  if (!row || row.deleted_at || !row.parent_email || row.parent_email.toLowerCase() !== parentEmail) {
    throw new ApiError(404, 'No account was found for that Child ID and parent email.');
  }

  const tempPassword = newTemporaryPassword();
  const expiresAt = tempPasswordExpiry();
  const { error } = await client
    .from('child_accounts')
    .update({
      temp_password_hash: hashCredential(tempPassword),
      temp_password_expires_at: expiresAt,
      requires_credential_reset: true,
      updated_at: new Date().toISOString(),
    })
    .eq('child_id', childId);
  if (error) throw new Error(error.message);

  return {
    childId: row.child_id,
    fullName: row.full_name,
    parentEmail: row.parent_email,
    tempPassword,
    expiresAt,
  };
}

async function resetCredential(client, body) {
  const childId = requireChildToken(body.token || body.sessionToken, body.childId);
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

  const hash = hashCredential(credential);
  const updates = type === 'password'
    ? { password_hash: hash, password_set: true, pin_hash: null, pin_set: false }
    : { pin_hash: hash, pin_set: true, password_hash: null, password_set: false };

  const { error } = await client
    .from('child_accounts')
    .update({
      ...updates,
      temp_password_hash: null,
      temp_password_expires_at: null,
      requires_credential_reset: false,
      updated_at: new Date().toISOString(),
    })
    .eq('child_id', childId);
  if (error) throw new Error(error.message);

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

async function verifyPin(client, body) {
  const childId = requireChildToken(body.token || body.sessionToken, body.childId);
  const pin = requireCredential(body.pin);
  const row = await getAccountRow(client, childId);
  if (!row || row.deleted_at) return { valid: false };

  const hash = hashCredential(pin);
  return {
    valid: (!!row.pin_set && safeEqual(row.pin_hash, hash))
      || (!!row.password_set && safeEqual(row.password_hash, hash)),
  };
}

const handler = async (req, res) => {
  requirePost(req, res);
  const body = readBody(req);
  const client = requireServerClient();

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
      const result = await issueTemporaryPassword(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'reset_credential': {
      const result = await resetCredential(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'verify_pin': {
      const result = await verifyPin(client, body);
      return json(res, 200, { success: true, ...result });
    }
    default:
      return json(res, 400, { success: false, error: 'Unknown action' });
  }
};

export default withErrors(handler);
