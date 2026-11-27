import crypto from 'node:crypto';
import { getServerClient } from './supabase-server.js';
import {
  isRateLimited as sharedIsRateLimited,
  recordFailure as sharedRecordFailure,
  clearFailures as sharedClearFailures,
} from './rate-limit.js';

export const DEVELOPER_EMAIL =
  process.env.DEVELOPER_EMAIL || 'addaifrederick72@gmail.com';

const SESSION_TTL_SECONDS = 30 * 60;
const RESET_TTL_SECONDS = 60 * 60;
const localResetTokens = new Set();

/** Shared throttle for developer sign-in and reset requests. */
export const isDeveloperRateLimited = (req, scope, id) => sharedIsRateLimited(scope, req, id);
export const recordDeveloperFailure = (req, scope, id) => sharedRecordFailure(scope, req, id);
export const clearDeveloperFailures = (req, scope, id) => sharedClearFailures(scope, req, id);

function getSecret() {
  const isProduction = process.env.NODE_ENV === 'production'
    || !!process.env.VERCEL
    || !!process.env.VERCEL_ENV;
  const secret = process.env.DEVELOPER_JWT_SECRET;
  if (secret) return secret;
  if (isProduction) {
    throw new Error('DEVELOPER_JWT_SECRET is required in production.');
  }
  return 'makenna-local-development-secret';
}

const b64url = value => Buffer.from(value).toString('base64url');
const fromB64url = value => Buffer.from(value, 'base64url').toString('utf8');

function sign(payload) {
  const encoded = b64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifySignedToken(token, expectedType) {
  try {
    const [encoded, signature] = String(token || '').split('.');
    if (!encoded || !signature) return null;
    const expected = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(fromB64url(encoded));
    if (payload.type !== expectedType) return null;
    if (!payload.exp || Date.now() > payload.exp * 1000) return null;
    if (payload.email?.toLowerCase() !== DEVELOPER_EMAIL.toLowerCase()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken() {
  return sign({
    type: 'session',
    email: DEVELOPER_EMAIL.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
}

export function verifySessionToken(token) {
  return verifySignedToken(token, 'session');
}

export function createResetToken() {
  return sign({
    type: 'reset',
    email: DEVELOPER_EMAIL.toLowerCase(),
    jti: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + RESET_TTL_SECONDS,
  });
}

export function verifyResetToken(token) {
  return verifySignedToken(token, 'reset');
}

/**
 * Persist a reset token id so it can be consumed exactly once. Without a
 * database (local development) a process-local set provides the same guard.
 */
export async function recordResetToken(token) {
  const payload = verifyResetToken(token);
  if (!payload?.jti) return false;
  const client = getServerClient();
  if (!client) {
    localResetTokens.add(payload.jti);
    return true;
  }
  try {
    const { error } = await client.from('developer_reset_tokens').upsert({
      jti: payload.jti,
      email: payload.email,
      expires_at: new Date(payload.exp * 1000).toISOString(),
      used_at: null,
      created_at: new Date().toISOString(),
    }, { onConflict: 'jti' });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Reset token record failed:', error.message);
    localResetTokens.add(payload.jti);
    return true;
  }
}

/** Atomically marks a reset token used; false means replayed or unknown. */
export async function consumeResetToken(token) {
  const payload = verifyResetToken(token);
  if (!payload?.jti) return false;
  const client = getServerClient();
  if (!client) {
    if (!localResetTokens.has(payload.jti)) return false;
    localResetTokens.delete(payload.jti);
    return true;
  }
  try {
    const { data, error } = await client
      .from('developer_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('jti', payload.jti)
      .is('used_at', null)
      .select('jti')
      .maybeSingle();
    if (error) throw error;
    // If token recording fell back to memory while the database was briefly
    // unavailable, honour that local record once the database recovers.
    if (!data && localResetTokens.delete(payload.jti)) return true;
    return !!data;
  } catch (error) {
    console.error('Reset token consumption failed:', error.message);
    if (!localResetTokens.has(payload.jti)) return false;
    localResetTokens.delete(payload.jti);
    return true;
  }
}

export function validateStrongPassword(password) {
  return typeof password === 'string'
    && password.length >= 12
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

function safeHexEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch (error) {
    return false;
  }
}

async function getAuthRecord() {
  const client = getServerClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('developer_auth')
      .select('email, password_hash, password_salt')
      .eq('id', 'default')
      .maybeSingle();
    if (error) {
      console.error('Developer auth lookup failed:', error.message);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error('Developer auth lookup failed:', error.message);
    return null;
  }
}

/** Verify against Supabase first, then an env-provided hash for simple setups. */
export async function verifyDeveloperPassword(email, password) {
  if (String(email || '').trim().toLowerCase() !== DEVELOPER_EMAIL.toLowerCase()) return false;

  const record = await getAuthRecord();
  const salt = record?.password_salt || process.env.DEVELOPER_PASSWORD_SALT || DEVELOPER_EMAIL;
  const expectedHash = record?.password_hash
    || process.env.DEVELOPER_PASSWORD_HASH
    || (process.env.DEVELOPER_PASSWORD ? hashPassword(process.env.DEVELOPER_PASSWORD, salt) : null);

  if (!expectedHash) return false;
  return safeHexEqual(hashPassword(password, salt), expectedHash);
}

/** Persist a new strong password hash. Requires the service-role key. */
export async function saveDeveloperPassword(newPassword) {
  const client = getServerClient();
  if (!client) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to save a new password.');
  }

  const passwordSalt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword, passwordSalt);
  const { error } = await client.from('developer_auth').upsert({
    id: 'default',
    email: DEVELOPER_EMAIL.toLowerCase(),
    password_hash: passwordHash,
    password_salt: passwordSalt,
    pin_hash: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) throw new Error(error.message);
  return true;
}
