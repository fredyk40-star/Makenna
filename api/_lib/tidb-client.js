import mysql from 'mysql2/promise';

/**
 * Server-only TiDB Cloud MySQL connection pool.
 *
 * TiDB Cloud connections are TLS-verified. A custom CA bundle may be supplied
 * through TIDB_CA; otherwise the Node.js trust store is used. There is no
 * "disable TLS" option: production credentials must never cross an unverified
 * connection.
 *
 * The pool is cached per serverless instance for safe connection reuse. It is
 * deliberately small because Vercel functions are short-lived.
 */
let pool = null;

export function isTiDBConfigured() {
  const { TIDB_HOST, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE } = process.env;
  return !!(TIDB_HOST && TIDB_USER && TIDB_PASSWORD && TIDB_DATABASE);
}

const positiveInt = (value, fallback, { allowZero = false } = {}) => {
  const parsed = Number(value || fallback);
  if (!Number.isInteger(parsed)) return fallback;
  return parsed >= (allowZero ? 0 : 1) ? parsed : fallback;
};

export function getTiDBPool() {
  if (!isTiDBConfigured()) return null;
  if (pool) return pool;

  const port = Number(process.env.TIDB_PORT || 4000);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('TIDB_PORT must be a valid TCP port.');
  }

  const ssl = { rejectUnauthorized: true };
  if (process.env.TIDB_CA) {
    // Vercel env values often contain literal escape sequences for PEM files.
    ssl.ca = process.env.TIDB_CA.replace(/\\n/g, '\n');
  }

  pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    port,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    charset: 'utf8mb4',
    ssl,
    waitForConnections: true,
    connectionLimit: positiveInt(process.env.TIDB_POOL_LIMIT, 3),
    maxIdle: positiveInt(process.env.TIDB_MAX_IDLE, 1, { allowZero: true }),
    idleTimeout: 30_000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    multipleStatements: false,
  });
  return pool;
}

/** Run a short transaction on one pooled connection, then release it. */
export async function withTiDBConnection(work) {
  const activePool = getTiDBPool();
  if (!activePool) throw new Error('TiDB is not configured.');
  const connection = await activePool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Test/lifecycle helper; not called from request handlers. */
export async function closeTiDBPool() {
  if (!pool) return;
  await pool.end();
  pool = null;
}
