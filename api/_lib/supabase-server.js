import { createClient } from '@supabase/supabase-js';

/**
 * Shared server-only Supabase client.
 *
 * The browser must never receive SUPABASE_SERVICE_ROLE_KEY. Every privileged
 * operation in this app goes through a Vercel function that uses this client.
 */
export function getServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;
  if (/YOUR_PROJECT|YOUR_SUPABASE|example/i.test(url)) return null;
  if (/YOUR_KEY|YOUR_SERVICE|example/i.test(serviceKey)) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function requireServerClient() {
  const client = getServerClient();
  if (!client) {
    const error = new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured on the server.',
    );
    error.status = 503;
    throw error;
  }
  return client;
}
