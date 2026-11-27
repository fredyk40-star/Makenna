# TiDB Cloud migration plan (draft)

**Status:** planning only. No TiDB instance, schema, Vercel env var, or application
behaviour has been changed yet.

## Decisions

- Keep Supabase live until the TiDB-backed app has been deployed and verified.
- Use **TiDB Cloud MySQL-compatible mode**. Do not use the PostgreSQL-compatible
  preview.
- Assume only test data needs to move; there is no production child data to preserve.
- Credentials stay in Vercel **server-side** environment variables. Never add a
  `VITE_*` alias for any database, SMTP, JWT, or Gemini secret.
- Use TLS and a restricted application database user. Runtime code must not need
  DDL privileges.
- Harden the local sync queue before relying on any cloud database for real children.

Useful references: [TiDB Cloud + Vercel](https://docs.pingcap.com/tidbcloud/integrate-tidbcloud-with-vercel/?plan=byoc)
and [Starter tier details](https://docs.pingcap.com/tidbcloud/select-cluster-tier/?plan=starter).
Check the current free quota and region availability before committing to a tier;
it is limited, not unlimited capacity.

## Why an adapter comes first

The API handlers currently call Supabase's query client directly through
`api/_lib/supabase-server.js`. A direct rewrite would touch registration, login,
sync, recovery, support, developer auth, rate limits, and tutor consent at once.

Instead, introduce one narrow server-side store interface and move handlers to it.
The Supabase implementation keeps today's behaviour; a TiDB implementation can be
added and tested without rewriting business logic. The final cutover becomes an
environment switch, not a large-bang rewrite.

## Phase 0 — Baseline

- [ ] Record the current known-good commit (`c6e1289`) and deployed commit.
- [ ] Run the full validation set before any migration work:
  - `node scripts/prebuild-check.js`
  - `npm run lint`
  - `npm test -- --run`
  - `npm run build`
  - `git diff --check`
- [ ] Inventory every direct Supabase call in `api/` and every table/column used.
- [ ] Confirm the browser still has no Supabase client and no `VITE_SUPABASE_*` env vars.

## Phase 1 — Storage adapter seam

Add `api/_lib/store.js` with a small contract, for example:

```js
getAccountRow(childId)
insertAccount(account)
updateAccount(childId, patch)
listAccounts({ includeDeleted })
insertSupportRequest(request)
listSupportRequests()
updateSupportRequest(id, patch)
deleteSupportRequest(id)
getDeveloperAuth()
saveDeveloperAuth(record)
recordResetToken(token)
consumeResetToken(token)
getRateLimit(key)
bumpRateLimit(key, windowSeconds)
deleteRateLimit(key)
getEmailVerification(childId, parentEmail)
saveEmailVerification(challenge)
consumeEmailVerification(challenge)
```

- [ ] Implement `supabaseStore` by moving the existing query code behind the contract.
- [ ] Update handlers to call `getStore()` instead of importing Supabase directly.
- [ ] Add `DATA_STORE=supabase|tidb`, defaulting to `supabase`.
- [ ] Add contract tests that run the same assertions against any adapter.
- [ ] Keep `requireServerClient()` only inside the Supabase adapter.

## Phase 2 — Harden the sync queue first

Files: `src/services/SyncQueueService.js`, `src/services/CloudSyncService.js`,
`src/services/SyncedLocalData.js`.

- [ ] Every queued write gets a stable idempotency key, e.g. `type:childId:version`.
- [ ] Retries reuse the key so a replay cannot create a duplicate or resurrect stale data.
- [ ] Keep `nextAttemptAt` backoff and an `attempts` counter.
- [ ] Exhausted items move to a visible dead-letter list; never silently drop them.
- [ ] If the queue exceeds its cap, preserve overflow for retry instead of discarding it.
- [ ] The server owns the monotonic `version`/`updatedAt`; client clock differences must
      not decide conflicts.
- [ ] Add tests for repeated failures, replay after success, cap overflow, and dead-letter recovery.

## Phase 3 — Portable schema

Add one canonical `tidb-schema.sql`; do not scatter ad-hoc SQL scripts.

| Current Supabase/PostgreSQL | TiDB/MySQL equivalent |
| --- | --- |
| `JSONB` | `JSON` |
| `TIMESTAMPTZ` | `DATETIME(6)` storing UTC |
| `gen_random_uuid()` | app-generated UUID from `crypto.randomUUID()` |
| RLS policies | no RLS; all access is through `/api/*` with a restricted DB user |
| PL/pgSQL `bump_auth_failure()` | `INSERT ... ON DUPLICATE KEY UPDATE` in the adapter |
| `auth.users` reference | drop FK; parent identity is verified by the server |

Tables to recreate:

- `child_accounts` — including `token_revoked_at`, `deleted_at`, `version`
- `support_requests` — including server-owned `parent_verified`
- `developer_auth`
- `developer_reset_tokens` — single-use `jti`, `used_at`
- `parent_email_verifications` — hashed code, `expires_at`, `attempts`
- `auth_rate_limits` — `key`, `count`, `first_at`, `last_at`
- feature flags, updates, trash, and sync state used by developer/sync routes

- [ ] Add indexes matching the current Supabase query patterns.
- [ ] Use `utf8mb4` and explicit UTC handling.
- [ ] Grant the app user only `SELECT`, `INSERT`, `UPDATE`, `DELETE` on the app tables.
- [ ] Verify no browser code can reach the database directly.

## Phase 4 — Security and connection setup

- [ ] Create the TiDB Cloud cluster in MySQL-compatible mode; confirm current Starter quota.
- [ ] Require TLS with server-certificate verification.
- [ ] Restrict network access with an IP allowlist or private connectivity where available.
- [ ] Create a least-privilege app user; keep the admin user out of Vercel.
- [ ] Add server-only Vercel env vars, for example:
  - `TIDB_HOST`, `TIDB_PORT`, `TIDB_DATABASE`, `TIDB_USER`, `TIDB_PASSWORD`
  - `TIDB_CA` only if a custom CA bundle is required
- [ ] Keep `SUPABASE_*`, `DEVELOPER_JWT_SECRET`, `CHILD_SESSION_SECRET`, Gmail, and
      `APP_URL` server-only.
- [ ] Preserve current protections: scrypt credential hashing, signed child/developer
      tokens, single-use resets, parent email verification, and distributed rate limits.
- [ ] Add a prebuild check that rejects any `VITE_TIDB_*` or other `VITE_` database secret.

## Phase 5 — Shadow run

- [ ] Seed only test accounts and test support requests.
- [ ] Run Supabase as the authoritative store and TiDB in shadow mode.
- [ ] Compare reads for registration, login, sync pull/push, support list, and developer list.
- [ ] Compare write effects for a throwaway child ID; verify no hash or token leaks.
- [ ] Check rate-limit counters and reset-token replay behaviour against TiDB.
- [ ] Keep Supabase env vars unchanged during this phase.

## Phase 6 — Cutover and rollback

- [ ] Set `DATA_STORE=tidb` in Vercel and redeploy.
- [ ] Smoke test: register, login, offline queue replay, PIN reset, parent verification,
      support submit, temp password issue/mail, developer login, tutor opt-in.
- [ ] Watch API error rates, 401/429 counts, and sync failures.
- [ ] Keep Supabase configured and read-only for at least one verification window.
- [ ] Rollback is flipping `DATA_STORE` back to `supabase`; no client change required.
- [ ] Only remove Supabase env vars after the deployed TiDB path is confirmed stable.

## Validation commands

```bash
node scripts/prebuild-check.js
npm run lint
npm test -- --run
npm run build
git diff --check
```

Stage only intended files; never `git add -A`. Do not commit the two root PNGs unless
explicitly confirmed.

## Open decisions

- Starter tier region, quota, and whether the free quota is sufficient for testing.
- MySQL driver choice in Vercel functions (likely `mysql2/promise`) and connection pooling.
- Whether `supabase-schema.sql` remains the canonical reference for data shape or becomes
  a legacy document alongside `tidb-schema.sql`.
- Whether shadow writes need a dry-run mode in the store interface.

## Explicitly out of scope

- Disabling Supabase before cutover verification.
- Using TiDB's PostgreSQL-compatible preview.
- Migrating real child data (there is only test data).
- Changing the browser to talk to any database directly.
