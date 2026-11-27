import { HttpError } from './http.js';
import { getServerClient } from './supabase-server.js';
import { isTiDBConfigured } from './tidb-client.js';
import { createSupabaseStore } from './store-supabase.js';
import { createTiDBStore } from './store-tidb.js';

/**
 * Server-only data-store seam.
 *
 * Supabase remains the default. TiDB/MySQL is selected explicitly with
 * DATA_STORE=tidb and only after its server-side credentials are configured.
 * Request handlers depend on this contract, not on a vendor query builder.
 */
export function getStore() {
  const mode = String(process.env.DATA_STORE || 'supabase').trim().toLowerCase();

  if (mode === 'tidb') {
    if (!isTiDBConfigured()) {
      throw new HttpError(503, 'TiDB is selected but its server-side credentials are missing.');
    }
    return createTiDBStore();
  }
  if (mode !== 'supabase') {
    throw new HttpError(500, `Unsupported DATA_STORE: ${mode}`);
  }
  return createSupabaseStore(getServerClient());
}

/** Used by helpers that still accept an explicit Supabase test client. */
export function storeForClient(client) {
  if (client && typeof client.isConfigured === 'function' && typeof client.findAccount === 'function') {
    return client;
  }
  return client ? createSupabaseStore(client) : getStore();
}

export function requireStore() {
  const store = getStore();
  if (!store.isConfigured()) {
    throw new HttpError(503, `No data store is configured. ${store.describeConfig()}.`);
  }
  return store;
}

export const OPERATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function validOperationId(value) {
  return typeof value === 'string' && OPERATION_ID_PATTERN.test(value) ? value : null;
}

export default getStore;
