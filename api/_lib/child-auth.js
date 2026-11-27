import crypto from 'node:crypto';
import { HttpError } from './http.js';
import { requireServerClient } from './supabase-server.js';
import {
  isRateLimited as sharedIsRateLimited,
  recordFailure as sharedRecordFailure,
  clearFailures as sharedClearFailures,
} from './rate-limit.js';

export const CHILD_ID_PATTERN = /^kid\d{8}$/i;
export const LEGACY_CHILD_ID_PATTERN = /^kid-\d+$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HASH_SALT = 'makenna-salt-v2';
const CHILD_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const TEMP_PASSWORD_MINUTES = 30;
const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
const STRONG_HASH_PREFIX = 'scrypt$';

export const normalizeChildId = (childId) => (
  typeof childId === 'string' ? childId.trim().toLowerCase() : null
);

export const validateChildId = (childId) => {
  const id = normalizeChildId(childId);
  return !!id && (CHILD_ID_PATTERN.test(id) || LEGACY_CHILD_ID_PATTERN.test(id));
};

export const validateName = (name) => (
  typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50
);

export const validatePin = (pin) => /^\d{4}$/.test(pin) || /^\d{8}$/.test(pin);

export const validatePassword = (password) => (
  typeof password === 'string' && password.length >= 8 && password.length <= 128
);

export const validateEmail = (email) => (
  typeof email === 'string' && EMAIL_PATTERN.test(email.trim())
);

/**
 * Matches the browser's historical SHA-256 digest so pre-hardening accounts
 * keep working. Verification now happens here and the hash never leaves the
 * database or the serverless function.
 */
/** Legacy SHA-256 digest, retained only to verify and upgrade old accounts. */
export const hashCredential = (credential) => crypto
  .createHash('sha256')
  .update(`${String(credential)}${HASH_SALT}`)
  .digest('hex');

/** New credentials use a per-credential random salt and scrypt. */
export const hashCredentialStrong = (credential) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.scryptSync(String(credential), salt, 64).toString('hex');
  return `${STRONG_HASH_PREFIX}${salt}$${digest}`;
};

export const credentialNeedsUpgrade = (hash) => (
  typeof hash !== 'string' || !hash.startsWith(STRONG_HASH_PREFIX)
);

/**
 * Verifies both formats and reports whether a legacy hash should be replaced.
 * Verification is centralised here so every credential check migrates old
 * accounts on successful use instead of requiring an offline password reset.
 */
export const verifyStoredCredential = (credential, storedHash) => {
  if (!storedHash || typeof storedHash !== 'string') {
    return { valid: false, needsUpgrade: false };
  }
  if (storedHash.startsWith(STRONG_HASH_PREFIX)) {
    const [, salt, digest] = storedHash.split('$');
    if (!salt || !digest) return { valid: false, needsUpgrade: false };
    const actual = crypto.scryptSync(String(credential), salt, 64).toString('hex');
    return { valid: safeEqual(actual, digest), needsUpgrade: false };
  }
  return {
    valid: safeEqual(storedHash, hashCredential(credential)),
    needsUpgrade: true,
  };
};

/** Replaces a verified legacy hash with the strong format. */
export async function upgradeCredential(client, childId, field, credential) {
  if (!client) return;
  try {
    const { error } = await client
      .from('child_accounts')
      .update({ [field]: hashCredentialStrong(credential) })
      .eq('child_id', normalizeChildId(childId));
    if (error) throw error;
  } catch (error) {
    console.error('Credential hash upgrade failed:', error.message);
  }
}

export const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
};

const b64url = (value) => Buffer.from(value).toString('base64url');

function getChildSecret() {
  const isProduction = process.env.NODE_ENV === 'production'
    || !!process.env.VERCEL
    || !!process.env.VERCEL_ENV;
  const secret = process.env.CHILD_SESSION_SECRET;
  if (secret) return secret;
  if (isProduction) {
    throw new Error('CHILD_SESSION_SECRET is required in production.');
  }
  return 'makenna-local-child-secret';
}

export function createChildToken(childId) {
  const id = normalizeChildId(childId);
  if (!id) throw new Error('A child ID is required.');
  const encoded = b64url(JSON.stringify({
    type: 'child',
    childId: id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + CHILD_TOKEN_TTL_SECONDS,
  }));
  const signature = crypto.createHmac('sha256', getChildSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyChildToken(token) {
  try {
    const [encoded, signature] = String(token || '').split('.');
    if (!encoded || !signature) return null;

    const expected = crypto.createHmac('sha256', getChildSecret()).update(encoded).digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (payload.type !== 'child' || !validateChildId(payload.childId)) return null;
    if (!payload.exp || Date.now() > payload.exp * 1000) return null;
    return normalizeChildId(payload.childId);
  } catch {
    return null;
  }
}

/** Issue time used to detect devices signed out via token revocation. */
export function childTokenIssuedAt(token) {
  try {
    const [encoded] = String(token || '').split('.');
    const payload = JSON.parse(Buffer.from(encoded || '', 'base64url').toString('utf8'));
    return Number(payload.iat) > 0 ? Number(payload.iat) : 0;
  } catch {
    return 0;
  }
}

/**
 * Authoritative device check: a correctly signed token is not enough if the
 * account was deleted or all devices were signed out after the token was issued.
 */
export async function requireActiveChild(client, token, childId) {
  const id = requireChildToken(token, childId);
  const row = await getAccountRow(client, id);
  if (!row || row.deleted_at) {
    throw new HttpError(403, 'This child account is no longer active.');
  }
  const revokedAt = row.token_revoked_at ? Date.parse(row.token_revoked_at) : 0;
  if (revokedAt && childTokenIssuedAt(token) * 1000 <= revokedAt) {
    throw new HttpError(401, 'This device has been signed out. Please log in again.');
  }
  return { childId: id, row };
}

/** Only child IDs with a valid, matching device token may be synced. */
export function authorizedChildIds(tokens) {
  const authorized = new Set();
  Object.entries(tokens && typeof tokens === 'object' ? tokens : {}).forEach(([childId, token]) => {
    const verified = verifyChildToken(token);
    if (verified && verified === normalizeChildId(childId)) authorized.add(verified);
  });
  return Array.from(authorized);
}

export function requireChildToken(token, childId) {
  const verified = verifyChildToken(token);
  const requested = normalizeChildId(childId);
  if (!verified || !requested || verified !== requested) {
    throw new HttpError(401, 'This device is no longer authorised for that child. Please log in again.');
  }
  return verified;
}

export const isRateLimited = (req, childId, client, scope = 'child') => (
  sharedIsRateLimited(scope, req, childId, client)
);
export const recordFailure = (req, childId, client, scope = 'child') => (
  sharedRecordFailure(scope, req, childId, client)
);
export const clearFailures = (req, childId, client, scope = 'child') => (
  sharedClearFailures(scope, req, childId, client)
);

export const getAccountRow = async (client, childId) => {
  const { data, error } = await client
    .from('child_accounts')
    .select('*')
    .eq('child_id', normalizeChildId(childId))
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
};

export async function createUniqueChildId(client) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const digits = String(crypto.randomInt(100000000)).padStart(8, '0');
    const childId = `kid${digits}`;
    if (!(await getAccountRow(client, childId))) return childId;
  }
  throw new Error('Could not generate a unique Child ID. Please try again.');
}

export function newTemporaryPassword() {
  let value = '';
  for (let i = 0; i < 14; i += 1) {
    value += TEMP_PASSWORD_CHARS[crypto.randomInt(TEMP_PASSWORD_CHARS.length)];
  }
  return value;
}

export const tempPasswordExpiry = () => new Date(
  Date.now() + TEMP_PASSWORD_MINUTES * 60 * 1000,
).toISOString();

/**
 * A temporary password may only be issued after a parent completed email
 * verification and the support team reviewed the resulting request.
 */
export async function hasVerifiedRecoveryRequest(client, childId, parentEmail, maxAgeMs = 24 * 60 * 60 * 1000) {
  const since = new Date(Date.now() - maxAgeMs).toISOString();
  const { data, error } = await client
    .from('support_requests')
    .select('id')
    .eq('child_id', normalizeChildId(childId))
    .eq('parent_email', String(parentEmail || '').trim().toLowerCase())
    .eq('parent_verified', true)
    .gte('created_at', since)
    .limit(1);
  if (error) throw new Error(error.message);
  return !!data?.length;
}

/** Public account shape. Credential hashes are deliberately never returned. */
export function toClientAccount(row) {
  return {
    childId: row.child_id,
    fullName: row.full_name,
    pinSet: !!row.pin_set,
    passwordSet: !!row.password_set,
    parentEmail: row.parent_email || null,
    requiresCredentialReset: !!row.requires_credential_reset,
    avatar: row.avatar || 'default',
    createdAt: row.created_at || null,
    lastLogin: row.last_login || null,
    progress: row.progress || {},
    settings: row.settings || {},
    updatedAt: row.updated_at || row.created_at || null,
    deletedAt: row.deleted_at || null,
    version: Number(row.version || 0),
  };
}

/** Only non-secret fields may be pushed from a device. */
export function syncPatch(account) {
  const patch = {};
  if (typeof account.fullName === 'string' && account.fullName.trim()) {
    patch.full_name = account.fullName.trim().slice(0, 50);
  }
  if (typeof account.avatar === 'string' && account.avatar) patch.avatar = account.avatar;
  if (account.lastLogin) patch.last_login = account.lastLogin;
  if (account.progress && typeof account.progress === 'object' && !Array.isArray(account.progress)) {
    patch.progress = account.progress;
  }
  if (account.settings && typeof account.settings === 'object' && !Array.isArray(account.settings)) {
    patch.settings = account.settings;
  }
  if (validateEmail(account.parentEmail)) patch.parent_email = account.parentEmail.trim().toLowerCase();
  if (account.updatedAt && !Number.isNaN(Date.parse(account.updatedAt))) {
    patch.updated_at = new Date(account.updatedAt).toISOString();
  } else {
    patch.updated_at = new Date().toISOString();
  }
  const version = Number(account.version);
  if (Number.isFinite(version) && version >= 0) patch.version = Math.floor(version);
  return patch;
}

export const timeOf = (value) => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
};

export { requireServerClient };
