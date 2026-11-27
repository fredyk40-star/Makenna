import crypto from 'node:crypto';
import { getTiDBPool, isTiDBConfigured } from './tidb-client.js';

/**
 * Semantic store implementation for TiDB Cloud in MySQL-compatible mode.
 *
 * Every statement uses bound parameters and whitelisted identifiers. JSON is
 * stored as MySQL JSON, timestamps as UTC DATETIME(6), and no Supabase Auth or
 * RLS concept is involved. This adapter is only selected by DATA_STORE=tidb.
 */
const COLUMNS = {
  child_accounts: new Set([
    'id', 'child_id', 'full_name', 'pin_hash', 'pin_set', 'password_hash', 'password_set',
    'parent_email', 'temp_password_hash', 'temp_password_expires_at',
    'requires_credential_reset', 'avatar', 'created_at', 'last_login', 'progress', 'settings',
    'updated_at', 'deleted_at', 'token_revoked_at', 'version',
  ]),
  support_requests: new Set([
    'id', 'child_id', 'parent_email', 'message', 'status', 'developer_note',
    'parent_verified', 'created_at', 'updated_at',
  ]),
  developer_auth: new Set([
    'id', 'email', 'pin_hash', 'password_hash', 'password_salt', 'created_at', 'updated_at',
  ]),
  developer_reset_tokens: new Set(['jti', 'email', 'expires_at', 'used_at', 'created_at']),
  parent_email_verifications: new Set([
    'id', 'child_id', 'parent_email', 'code_hash', 'expires_at', 'attempts', 'created_at',
  ]),
  auth_rate_limits: new Set(['limit_key', 'count', 'first_at', 'last_at']),
  sync_operations: new Set(['child_id', 'operation_id', 'action', 'response', 'created_at']),
  feature_flags: new Set(['id', 'flags', 'updated_at']),
  developer_updates: new Set([
    'id', 'version', 'type', 'changelog', 'target', 'target_ids', 'preview_children',
    'status', 'created_at', 'updated_at',
  ]),
  developer_trash: new Set([
    'child_id', 'full_name', 'avatar', 'progress', 'settings', 'created_at', 'deleted_at',
  ]),
};

const ALL_COLUMNS = new Set(Object.values(COLUMNS).flatMap(columns => [...columns]));

const JSON_FIELDS = new Set([
  'progress', 'settings', 'flags', 'target_ids', 'preview_children', 'response',
]);
const DATE_FIELDS = new Set([
  'created_at', 'updated_at', 'last_login', 'deleted_at', 'token_revoked_at',
  'temp_password_expires_at', 'expires_at', 'used_at', 'first_at', 'last_at',
]);

const sqlValue = (field, value) => {
  if (value === undefined) return null;
  if (JSON_FIELDS.has(field) && value !== null && typeof value !== 'string') {
    return JSON.stringify(value);
  }
  return value;
};

const normalizeRow = (row) => {
  if (!row || typeof row !== 'object') return row || null;
  const result = { ...row };
  Object.keys(result).forEach((field) => {
    if (JSON_FIELDS.has(field) && typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field]);
      } catch {
        result[field] = null;
      }
    }
    if (DATE_FIELDS.has(field)) {
      if (result[field] instanceof Date) result[field] = result[field].toISOString();
      else if (typeof result[field] === 'string' && result[field]) {
        const parsed = Date.parse(result[field]);
        if (Number.isFinite(parsed)) result[field] = new Date(parsed).toISOString();
      }
    }
  });
  return result;
};

const allowedEntries = (table, row) => Object.entries(row)
  .filter(([field]) => COLUMNS[table]?.has(field))
  .map(([field, value]) => [field, sqlValue(field, value)]);

function buildWhere(conditions = []) {
  const clauses = [];
  const params = [];
  conditions.forEach(({ column, op = '=', value }) => {
    if (!ALL_COLUMNS.has(column)) {
      throw new Error(`Unrecognised filter column: ${column}`);
    }
    if (op === 'IS NULL') {
      clauses.push('?? IS NULL');
      params.push(column);
      return;
    }
    if (op === 'IN') {
      const values = Array.isArray(value) ? value : [];
      if (!values.length) {
        clauses.push('1 = 0');
        return;
      }
      clauses.push(`?? IN (${values.map(() => '?').join(', ')})`);
      params.push(column, ...values);
      return;
    }
    clauses.push(`?? ${op} ?`);
    params.push(column, value);
  });
  return { sql: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', params };
}

/**
 * `poolOverride` is used by tests to supply a fake query executor without any
 * live credentials or network connection. Request handlers never pass one.
 */
export function createTiDBStore(poolOverride = null) {
  const pool = () => {
    if (poolOverride) return poolOverride;
    if (!isTiDBConfigured()) return null;
    return getTiDBPool();
  };

  async function selectRows(table, conditions = [], options = {}) {
    const activePool = pool();
    if (!activePool) throw new Error('TiDB is not configured.');
    const where = buildWhere(conditions);
    let sql = `SELECT ${options.columns?.length ? options.columns.map(() => '??').join(', ') : '*'} FROM ??${where.sql}`;
    const params = [
      ...(options.columns || []),
      table,
      ...where.params,
    ];
    if (options.orderBy) sql += ` ORDER BY ?? ${options.direction === 'asc' ? 'ASC' : 'DESC'}`;
    if (options.orderBy) params.push(options.orderBy);
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(Number(options.limit));
    }
    const [rows] = await activePool.query(sql, params);
    return (Array.isArray(rows) ? rows : []).map(normalizeRow);
  }

  async function insertRow(table, row) {
    const activePool = pool();
    if (!activePool) throw new Error('TiDB is not configured.');
    const entries = allowedEntries(table, row);
    if (!entries.length) return;
    const columns = entries.map(([column]) => column);
    const values = entries.map(([, value]) => value);
    const sql = `INSERT INTO ?? (${columns.map(() => '??').join(', ')}) VALUES (${values.map(() => '?').join(', ')})`;
    await activePool.query(sql, [table, ...columns, ...values]);
  }

  async function upsertRows(table, rows, conflictColumns = []) {
    const activePool = pool();
    if (!activePool) throw new Error('TiDB is not configured.');
    for (const row of rows) {
      const entries = allowedEntries(table, row);
      if (!entries.length) continue;
      const columns = entries.map(([column]) => column);
      const values = entries.map(([, value]) => value);
      const valueByColumn = new Map(entries);
      const updates = columns.filter(column => !conflictColumns.includes(column));
      const updateColumns = updates.length ? updates : [columns[0]];
      const sql = `INSERT INTO ?? (${columns.map(() => '??').join(', ')}) VALUES (${values.map(() => '?').join(', ')}) `
        + `ON DUPLICATE KEY UPDATE ${updateColumns.map(() => '?? = ?').join(', ')}`;
      const updateValues = updateColumns.flatMap(column => [column, valueByColumn.get(column) ?? null]);
      await activePool.query(sql, [table, ...columns, ...values, ...updateValues]);
    }
  }

  async function updateRows(table, patch, conditions = []) {
    const activePool = pool();
    if (!activePool) throw new Error('TiDB is not configured.');
    const entries = allowedEntries(table, patch);
    if (!entries.length) return 0;
    const where = buildWhere(conditions);
    const assignments = entries.map(() => '?? = ?').join(', ');
    const sql = `UPDATE ?? SET ${assignments}${where.sql}`;
    const params = [
      table,
      ...entries.flatMap(([column, value]) => [column, value]),
      ...where.params,
    ];
    const [result] = await activePool.query(sql, params);
    return result.affectedRows || 0;
  }

  async function deleteRows(table, conditions = []) {
    const activePool = pool();
    if (!activePool) throw new Error('TiDB is not configured.');
    const where = buildWhere(conditions);
    const [result] = await activePool.query(`DELETE FROM ??${where.sql}`, [table, ...where.params]);
    return result.affectedRows || 0;
  }

  const findAccountRow = async (childId) => (await selectRows('child_accounts', [
    { column: 'child_id', value: childId },
  ], { limit: 1 }))[0] || null;

  return {
    kind: 'tidb',
    isConfigured: () => !!pool(),
    describeConfig: () => 'TIDB_HOST, TIDB_PORT, TIDB_DATABASE, TIDB_USER and TIDB_PASSWORD must be set on the server',

    // Accounts
    findAccount: findAccountRow,
    insertAccount: async (row) => {
      const withId = { ...row, id: row.id || crypto.randomUUID() };
      await insertRow('child_accounts', withId);
      return findAccountRow(withId.child_id);
    },
    updateAccount: async (childId, patch) => {
      await updateRows('child_accounts', patch, [{ column: 'child_id', value: childId }]);
    },
    listActiveAccounts: async () => selectRows('child_accounts', [
      { column: 'deleted_at', op: 'IS NULL' },
    ], { orderBy: 'created_at' }),
    listAccountsByIds: async (childIds) => (!childIds.length ? [] : selectRows('child_accounts', [
      { column: 'child_id', op: 'IN', value: childIds },
      { column: 'deleted_at', op: 'IS NULL' },
    ])),

    // Parent-verified recovery requests
    findVerifiedSupportRequest: async (childId, parentEmail, since) => {
      const rows = await selectRows('support_requests', [
        { column: 'child_id', value: childId },
        { column: 'parent_email', value: parentEmail },
        { column: 'parent_verified', value: 1 },
        { column: 'created_at', op: '>=', value: since },
      ], { columns: ['id'], limit: 1 });
      return rows.length > 0;
    },
    insertSupportRequest: async (row) => {
      await insertRow('support_requests', row);
      return (await selectRows('support_requests', [{ column: 'id', value: row.id }], { limit: 1 }))[0];
    },
    listSupportRequests: async () => selectRows('support_requests', [], { orderBy: 'created_at' }),
    listSupportRequestsByIds: async (ids) => (!ids.length ? [] : selectRows('support_requests', [
      { column: 'id', op: 'IN', value: ids },
    ], { columns: ['id', 'parent_verified'] })),
    upsertSupportRequests: async (rows) => upsertRows('support_requests', rows, ['id']),
    updateSupportRequest: async (id, patch) => {
      await updateRows('support_requests', patch, [{ column: 'id', value: id }]);
    },
    deleteSupportRequest: async (id) => {
      await deleteRows('support_requests', [{ column: 'id', value: id }]);
    },

    // Developer credentials and single-use reset links
    findDeveloperAuth: async () => (await selectRows('developer_auth', [
      { column: 'id', value: 'default' },
    ], {
      columns: ['email', 'password_hash', 'password_salt'],
      limit: 1,
    }))[0] || null,
    upsertDeveloperAuth: async (row) => upsertRows('developer_auth', [row], ['id']),
    upsertResetToken: async (token) => upsertRows('developer_reset_tokens', [token], ['jti']),
    consumeResetToken: async (jti, usedAt) => {
      const activePool = pool();
      if (!activePool) throw new Error('TiDB is not configured.');
      const [result] = await activePool.query(
        'UPDATE ?? SET ?? = ? WHERE ?? = ? AND ?? IS NULL',
        ['developer_reset_tokens', 'used_at', usedAt, 'jti', jti, 'used_at'],
      );
      return (result.affectedRows || 0) > 0;
    },

    // Parent email verification challenges
    upsertEmailVerification: async (row) => upsertRows('parent_email_verifications', [row], ['child_id', 'parent_email']),
    findEmailVerification: async (childId, parentEmail) => (await selectRows('parent_email_verifications', [
      { column: 'child_id', value: childId },
      { column: 'parent_email', value: parentEmail },
    ], {
      columns: ['id', 'code_hash', 'expires_at', 'attempts'],
      limit: 1,
    }))[0] || null,
    updateEmailVerificationAttempts: async (id, attempts) => {
      await updateRows('parent_email_verifications', { attempts }, [{ column: 'id', value: id }]);
    },
    deleteEmailVerification: async (id) => {
      await deleteRows('parent_email_verifications', [{ column: 'id', value: id }]);
    },

    // Distributed throttling: the RPC is replaced by one atomic upsert.
    findRateLimit: async (key) => (await selectRows('auth_rate_limits', [
      { column: 'limit_key', value: key },
    ], { columns: ['count', 'first_at'], limit: 1 }))[0] || null,
    bumpRateLimit: async (key, windowSeconds) => {
      const activePool = pool();
      if (!activePool) throw new Error('TiDB is not configured.');
      await activePool.query(
        `INSERT INTO ?? (??, ??, ??, ??) VALUES (?, 1, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6))
         ON DUPLICATE KEY UPDATE
           ?? = CASE WHEN ?? < DATE_SUB(UTC_TIMESTAMP(6), INTERVAL ? SECOND) THEN 1 ELSE ?? + 1 END,
           ?? = CASE WHEN ?? < DATE_SUB(UTC_TIMESTAMP(6), INTERVAL ? SECOND) THEN UTC_TIMESTAMP(6) ELSE ?? END,
           ?? = UTC_TIMESTAMP(6)`,
        [
          'auth_rate_limits', 'limit_key', 'count', 'first_at', 'last_at', key,
          'count', 'first_at', windowSeconds, 'count',
          'first_at', 'first_at', windowSeconds, 'first_at',
          'last_at',
        ],
      );
      const row = (await selectRows('auth_rate_limits', [
        { column: 'limit_key', value: key },
      ], { columns: ['count'], limit: 1 }))[0];
      return Number(row?.count || 0);
    },
    deleteRateLimit: async (key) => {
      await deleteRows('auth_rate_limits', [{ column: 'limit_key', value: key }]);
    },

    // Client operation idempotency
    findSyncOperation: async (childId, operationId) => (await selectRows('sync_operations', [
      { column: 'child_id', value: childId },
      { column: 'operation_id', value: operationId },
    ], { columns: ['action', 'response'], limit: 1 }))[0] || null,
    recordSyncOperation: async (row) => upsertRows('sync_operations', [row], ['child_id', 'operation_id']),

    // Developer dashboard data
    upsertFeatureFlags: async (row) => upsertRows('feature_flags', [row], ['id']),
    findFeatureFlags: async () => (await selectRows('feature_flags', [
      { column: 'id', value: 'default' },
    ], { columns: ['flags'], limit: 1 }))[0] || null,
    upsertDeveloperUpdates: async (rows) => upsertRows('developer_updates', rows, ['id']),
    listDeveloperUpdates: async () => selectRows('developer_updates', [], { orderBy: 'created_at' }),
    upsertDeveloperTrash: async (row) => upsertRows('developer_trash', [row], ['child_id']),
    listDeveloperTrash: async () => selectRows('developer_trash', [], { orderBy: 'deleted_at' }),
    deleteDeveloperTrash: async (childId) => {
      await deleteRows('developer_trash', [{ column: 'child_id', value: childId }]);
    },
  };
}

export default createTiDBStore;
