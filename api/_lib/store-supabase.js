import { getServerClient } from './supabase-server.js';

/**
 * Semantic store implementation backed by the existing server-only Supabase
 * client. A client may be injected for tests; request handlers use getStore().
 */
function unwrap(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export function createSupabaseStore(client = null) {
  const activeClient = () => client || getServerClient();

  return {
    kind: 'supabase',
    isConfigured: () => !!activeClient(),
    describeConfig: () => 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server',

    // Accounts
    findAccount: async (childId) => unwrap(await activeClient()
      .from('child_accounts')
      .select('*')
      .eq('child_id', childId)
      .maybeSingle()),
    insertAccount: async (row) => unwrap(await activeClient()
      .from('child_accounts')
      .insert(row)
      .select('*')
      .single()),
    updateAccount: async (childId, patch) => {
      unwrap(await activeClient().from('child_accounts').update(patch).eq('child_id', childId));
    },
    listActiveAccounts: async () => (unwrap(await activeClient()
      .from('child_accounts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })) || []),
    listAccountsByIds: async (childIds) => (!childIds.length ? [] : (unwrap(await activeClient()
      .from('child_accounts')
      .select('*')
      .in('child_id', childIds)
      .is('deleted_at', null)) || [])),

    // Parent-verified recovery requests
    findVerifiedSupportRequest: async (childId, parentEmail, since) => (unwrap(await activeClient()
      .from('support_requests')
      .select('id')
      .eq('child_id', childId)
      .eq('parent_email', parentEmail)
      .eq('parent_verified', true)
      .gte('created_at', since)
      .limit(1)) || []).length > 0,
    insertSupportRequest: async (row) => unwrap(await activeClient()
      .from('support_requests')
      .insert(row)
      .select('*')
      .single()),
    listSupportRequests: async () => (unwrap(await activeClient()
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false })) || []),
    listSupportRequestsByIds: async (ids) => (!ids.length ? [] : (unwrap(await activeClient()
      .from('support_requests')
      .select('id, parent_verified')
      .in('id', ids)) || [])),
    upsertSupportRequests: async (rows) => {
      if (!rows.length) return;
      unwrap(await activeClient().from('support_requests').upsert(rows, { onConflict: 'id' }));
    },
    updateSupportRequest: async (id, patch) => {
      unwrap(await activeClient().from('support_requests').update(patch).eq('id', id));
    },
    deleteSupportRequest: async (id) => {
      unwrap(await activeClient().from('support_requests').delete().eq('id', id));
    },

    // Developer credentials and single-use reset links
    findDeveloperAuth: async () => unwrap(await activeClient()
      .from('developer_auth')
      .select('email, password_hash, password_salt')
      .eq('id', 'default')
      .maybeSingle()),
    upsertDeveloperAuth: async (row) => {
      unwrap(await activeClient().from('developer_auth').upsert(row, { onConflict: 'id' }));
    },
    upsertResetToken: async (token) => {
      unwrap(await activeClient().from('developer_reset_tokens').upsert(token, { onConflict: 'jti' }));
    },
    consumeResetToken: async (jti, usedAt) => {
      const data = unwrap(await activeClient()
        .from('developer_reset_tokens')
        .update({ used_at: usedAt })
        .eq('jti', jti)
        .is('used_at', null)
        .select('jti')
        .maybeSingle());
      return !!data;
    },

    // Parent email verification challenges
    upsertEmailVerification: async (row) => {
      unwrap(await activeClient()
        .from('parent_email_verifications')
        .upsert(row, { onConflict: 'child_id,parent_email' }));
    },
    findEmailVerification: async (childId, parentEmail) => unwrap(await activeClient()
      .from('parent_email_verifications')
      .select('id, code_hash, expires_at, attempts')
      .eq('child_id', childId)
      .eq('parent_email', parentEmail)
      .maybeSingle()),
    updateEmailVerificationAttempts: async (id, attempts) => {
      unwrap(await activeClient()
        .from('parent_email_verifications')
        .update({ attempts })
        .eq('id', id));
    },
    deleteEmailVerification: async (id) => {
      unwrap(await activeClient().from('parent_email_verifications').delete().eq('id', id));
    },

    // Distributed throttling
    findRateLimit: async (key) => unwrap(await activeClient()
      .from('auth_rate_limits')
      .select('count, first_at')
      .eq('key', key)
      .maybeSingle()),
    bumpRateLimit: async (key, windowSeconds) => Number(unwrap(await activeClient().rpc('bump_auth_failure', {
      p_key: key,
      p_window_seconds: windowSeconds,
    }))),
    deleteRateLimit: async (key) => {
      unwrap(await activeClient().from('auth_rate_limits').delete().eq('key', key));
    },

    // Client operation idempotency
    findSyncOperation: async (childId, operationId) => unwrap(await activeClient()
      .from('sync_operations')
      .select('action, response')
      .eq('child_id', childId)
      .eq('operation_id', operationId)
      .maybeSingle()),
    recordSyncOperation: async (row) => {
      unwrap(await activeClient().from('sync_operations').upsert(row, { onConflict: 'child_id,operation_id' }));
    },

    // Developer dashboard data
    upsertFeatureFlags: async (row) => {
      unwrap(await activeClient().from('feature_flags').upsert(row, { onConflict: 'id' }));
    },
    findFeatureFlags: async () => unwrap(await activeClient()
      .from('feature_flags')
      .select('flags')
      .eq('id', 'default')
      .maybeSingle()),
    upsertDeveloperUpdates: async (rows) => {
      for (const row of rows) {
        unwrap(await activeClient().from('developer_updates').upsert(row, { onConflict: 'id' }));
      }
    },
    listDeveloperUpdates: async () => (unwrap(await activeClient()
      .from('developer_updates')
      .select('*')
      .order('created_at', { ascending: false })) || []),
    upsertDeveloperTrash: async (row) => {
      unwrap(await activeClient().from('developer_trash').upsert(row, { onConflict: 'child_id' }));
    },
    listDeveloperTrash: async () => (unwrap(await activeClient()
      .from('developer_trash')
      .select('*')
      .order('deleted_at', { ascending: false })) || []),
    deleteDeveloperTrash: async (childId) => {
      unwrap(await activeClient().from('developer_trash').delete().eq('child_id', childId));
    },
  };
}

export default createSupabaseStore;
