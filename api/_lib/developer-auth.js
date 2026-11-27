import crypto from 'node:crypto';
import { getServerClient } from './supabase-server.js';

export const DEVELOPER_EMAIL =
  process.env.DEVELOPER_EMAIL || 'addaifrederick72@gmail.com';

const SESSION_TTL_SECONDS = 30 * 60;
const RESET_TTL_SECONDS = 60 * 60;
const AUTH_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT_MAX = 10;
const authAttempts = new Map();

/**
 * Best-effort per-instance throttle for sign-in and reset requests.
 * Vercel functions are short-lived, so this stops obvious brute-force bursts
 * without turning the developer portal into a database-backed auth system.
 */
export function checkDeveloperAuthRateLimit(key) {
  const now = Date.now();
  const bucket = authAttempts.get(key);
  if (!bucket || bucket.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + AUTH_LIMIT_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= AUTH_LIMIT_MAX;
}

export function resetDeveloperAuthRateLimit(key) {
  authAttempts.delete(key);
}

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
    exp: Math.floor(Date.now() / 1000) + RESET_TTL_SECONDS,
  });
}

export function verifyResetToken(token) {
  return verifySignedToken(token, 'reset');
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
