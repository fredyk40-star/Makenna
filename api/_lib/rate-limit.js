import { HttpError } from './http.js';
import { storeForClient } from './store.js';

/**
 * Shared, distributed login/request throttling.
 *
 * The authoritative counters live in the configured data store so separate
 * serverless instances see the same failures. When no store is configured
 * (local development and unit tests) we fall back to a process-local map with
 * identical behaviour.
 */
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const local = new Map();

export const clientIp = (req) => String(
  req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'local',
).split(',')[0].trim();

const keyFor = (scope, req, id) => `${scope}:${clientIp(req)}:${String(id || '').trim().toLowerCase()}`;

function localCount(key, windowMs = WINDOW_MS) {
  const entry = local.get(key);
  if (!entry) return 0;
  if (Date.now() - entry.firstAt > windowMs) {
    local.delete(key);
    return 0;
  }
  return entry.count;
}

function localBump(key, windowMs = WINDOW_MS) {
  const entry = local.get(key) && Date.now() - local.get(key).firstAt <= windowMs
    ? local.get(key)
    : { count: 0, firstAt: Date.now() };
  entry.count += 1;
  local.set(key, entry);
  return entry.count;
}

const enforce = (count, max, message) => {
  if (count >= max) throw new HttpError(429, message);
};

const resolveStore = client => storeForClient(client);

export async function isRateLimited(scope, req, id, client) {
  const key = keyFor(scope, req, id);
  const store = resolveStore(client);
  if (!store.isConfigured()) return localCount(key) >= MAX_FAILURES;
  try {
    const data = await store.findRateLimit(key);
    if (!data) return false;
    return Date.now() - Date.parse(data.first_at) <= WINDOW_MS
      && Number(data.count) >= MAX_FAILURES;
  } catch (error) {
    console.error('Rate limit lookup failed:', error.message);
    return localCount(key) >= MAX_FAILURES;
  }
}

export async function recordFailure(scope, req, id, client) {
  const key = keyFor(scope, req, id);
  const store = resolveStore(client);
  if (!store.isConfigured()) {
    enforce(localBump(key), MAX_FAILURES, 'Too many attempts. Please wait 15 minutes and try again.');
    return;
  }
  try {
    const count = await store.bumpRateLimit(key, Math.floor(WINDOW_MS / 1000));
    enforce(Number(count), MAX_FAILURES, 'Too many attempts. Please wait 15 minutes and try again.');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('Rate limit update failed:', error.message);
    enforce(localBump(key), MAX_FAILURES, 'Too many attempts. Please wait 15 minutes and try again.');
  }
}

/**
 * Generic per-request throttle used by routes with their own limits (for
 * example the online tutor). Every call increments the counter before the
 * handler proceeds, and the DB-backed counter keeps it consistent across
 * serverless instances.
 */
export async function checkRequestLimit(scope, req, id, options = {}, client) {
  const max = options.max ?? MAX_FAILURES;
  const windowMs = options.windowMs ?? WINDOW_MS;
  const message = options.message || 'Too many attempts. Please wait 15 minutes and try again.';
  const key = keyFor(scope, req, id);
  const store = resolveStore(client);

  if (!store.isConfigured()) {
    enforce(localBump(key, windowMs), max, message);
    return;
  }
  try {
    const count = await store.bumpRateLimit(key, Math.floor(windowMs / 1000));
    enforce(Number(count), max, message);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('Rate limit update failed:', error.message);
    enforce(localBump(key, windowMs), max, message);
  }
}

export async function clearFailures(scope, req, id, client) {
  const key = keyFor(scope, req, id);
  local.delete(key);
  const store = resolveStore(client);
  if (!store.isConfigured()) return;
  try {
    await store.deleteRateLimit(key);
  } catch (error) {
    console.error('Rate limit reset failed:', error.message);
  }
}
