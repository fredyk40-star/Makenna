import { createClient } from '@supabase/supabase-js';

// Supabase client configuration. Placeholder values from .env.example must not
// be treated as a live project, otherwise every local write queues a failing
// network request instead of staying offline.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isRealValue = value => (
  typeof value === 'string'
  && value.trim().length > 0
  && !/your[_-]?project|your[_-]?key|example|placeholder|change[_-]?me/i.test(value)
);

// Create client only if environment variables are set
export const supabase = isRealValue(supabaseUrl) && isRealValue(supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;

// Sync status tracking
let syncInProgress = false;
let lastSyncTime = null;

export { syncInProgress, lastSyncTime };
