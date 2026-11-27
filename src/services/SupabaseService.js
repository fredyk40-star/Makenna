/**
 * Deprecated: the browser no longer accesses Supabase directly.
 *
 * Cloud reads and writes go through /api/* serverless functions that use the
 * service-role key. This module is kept only so older imports cannot
 * accidentally create an anon-key client from VITE_* variables.
 */
export const supabase = null;
export const isSupabaseConfigured = () => false;

let syncInProgress = false;
let lastSyncTime = null;

export { syncInProgress, lastSyncTime };
