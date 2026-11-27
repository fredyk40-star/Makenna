# TiDB Cloud migration plan

**Status:** local implementation and offline tests are complete. No TiDB instance,
schema, Vercel environment variable, or production behaviour has been changed.
Supabase remains the default store and is still authoritative.

## Decisions

- Keep Supabase live until a TiDB-backed deployment has been deployed and verified.
- Use **TiDB Cloud MySQL-compatible mode**. Do not use the PostgreSQL-compatible
  preview.
- Assume only test data needs to move; there is no production child data to preserve.
- Credentials stay in Vercel **server-side** environment variables. Never add a
  `VITE_*` alias for any database, SMTP, JWT, or Gemini secret.
- Use TLS with certificate verification and a restricted application database user.
  Runtime code must not need DDL privileges.
- `mysql2/promise` is the driver. A small pool is cached per serverless instance and
  never exposed to browser code.
- The final cutover is an explicit `DATA_STORE=tidb` change, not a large-bang rewrite.
- Rollback after TiDB has accepted writes requires a write freeze and reconciliation;
  it is not just an env-var flip.

Useful references: [TiDB Cloud + Vercel](https://docs.pingcap.com/tidbcloud/integrate-tidbcloud-with-vercel/?plan=byoc)
and [Starter tier details](https://docs.pingcap.com/tidbcloud/select-cluster-tier/?plan=starter).
Check the current free quota and region availability before committing to a tier;
it is limited, not unlimited capacity.

## What is implemented locally

- [x] Server-only store seam in `api/_lib/store.js`: `DATA_STORE=supabase` by default,
      `DATA_STORE=tidb` only when TiDB credentials are present.
- [x] `store-supabase.js` preserves current behaviour behind the semantic contract.
- [x] `store-tidb.js` implements the same contract with bound parameters and MySQL
      syntax. JSON, UTC timestamps and single-use tokens are handled explicitly.
- [x] `tidb-client.js` uses `mysql2/promise`, `rejectUnauthorized: true`, optional
      `TIDB_CA`, validated ports/pool sizes, and a cached small pool.
- [x] All API handlers now use the store seam. Direct Supabase query calls remain
      only inside the Supabase adapter.
- [x] `sync_operations` stores client operation IDs as retry keys. They are separate
      from server-owned `version`/`updatedAt`.
- [x] The sync queue preserves overflow, dead-letters exhausted operations, exposes
      failed/blocked counts, and retries with the original operation ID.
- [x] Offline/reconnect, multi-device conflict, replay, skip, adapter SQL, and API
      idempotency tests have been added.
- [x] `scripts/prebuild-check.js` rejects browser-side `VITE_TIDB_*` and other
      `VITE_` database/JWT/SMTP secrets.

## Phase 0 — Baseline

- [x] Recorded known-good commit `c6e1289` and migration-plan commit `f44a390`.
- [x] Ran the full validation set before migration work.
- [x] Inventoried direct Supabase calls and every runtime table/column used.
- [x] Confirmed browser code has no Supabase client and no `VITE_SUPABASE_*` usage.
- [x] Preserved unrelated working-tree changes (UI styling, NavigationCards, PNGs).

Runtime tables: `child_accounts`, `support_requests`, `developer_auth`,
`developer_reset_tokens`, `parent_email_verifications`, `auth_rate_limits`,
`sync_operations`, `feature_flags`, `developer_updates`, `developer_trash`.
The only runtime RPC is `bump_auth_failure(p_key, p_window_seconds)`; TiDB replaces
it with an atomic `INSERT ... ON DUPLICATE KEY UPDATE`.

`sync_state` and `parent_profiles` are legacy schema-only tables and are deliberately
omitted from `tidb-schema.sql`. There is no Supabase Auth usage, no `auth.uid()`, and
no `auth.users` foreign key to reproduce.

## Phase 1 — Storage adapter seam

The contract includes account lookup/upsert, support requests, developer credentials,
single-use reset links, parent email challenges, distributed throttling, client
operation idempotency, and developer dashboard data. `storeForClient()` keeps old
tests that inject a Supabase-shaped client working without leaking vendor code into
handlers.

## Phase 2 — Sync queue hardening

- [x] Stable client-generated operation IDs are persisted with each queued write.
- [x] Retries keep the same operation ID; new writes get new IDs.
- [x] Backoff (`nextAttemptAt`) and `attempts` survive reloads.
- [x] Exhausted operations move to a visible dead-letter list with retry support.
- [x] Queue overflow is preserved and promoted instead of discarded.
- [x] Server push/delete endpoints record operation responses and replay them safely.
- [x] Server-owned `version`/`updatedAt` still decide timestamp skips.

## Phase 3 — Portable schema

`tidb-schema.sql` is the single canonical MySQL-compatible schema. It is idempotent,
uses `utf8mb4`, `DATETIME(6)` for UTC, MySQL `JSON`, app-generated UUIDs, and indexes
matching current query patterns. No runtime statement performs DDL.

| Supabase/PostgreSQL | TiDB/MySQL equivalent |
| --- | --- |
| `JSONB` | `JSON` |
| `TIMESTAMPTZ` | `DATETIME(6)` storing UTC |
| `gen_random_uuid()` | app-generated UUID from `crypto.randomUUID()` |
| RLS policies | no RLS; all access is through `/api/*` with a restricted DB user |
| PL/pgSQL `bump_auth_failure()` | `INSERT ... ON DUPLICATE KEY UPDATE` in the adapter |
| `auth.users` reference | dropped; parent identity is verified by the server |

The canonical `supabase-schema.sql` was updated with `sync_operations` and its least
privilege grants. **Re-run it in Supabase** before any cutover so Supabase can still
accept replayed sync operations if a rollback is needed.

## Phase 4 — Manual TiDB setup (not yet done)

1. In TiDB Cloud, create a cluster in **MySQL-compatible mode**. Confirm the Starter
   quota and region before selecting a tier.
2. Create the database and a least-privilege application user with an admin connection:

   ```sql
   CREATE DATABASE IF NOT EXISTS makenna CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'makenna_app'@'%' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';
   GRANT SELECT, INSERT, UPDATE, DELETE ON makenna.* TO 'makenna_app'@'%';
   FLUSH PRIVILEGES;
   ```

3. Run `tidb-schema.sql` with an admin user. The app user never needs DDL rights.
4. Restrict network access with TiDB Cloud's IP allowlist or private connectivity.
5. Add these **server-only** Vercel variables. Do not prefix any of them with `VITE_`:

   ```text
   DATA_STORE=supabase
   TIDB_HOST=
   TIDB_PORT=4000
   TIDB_DATABASE=makenna
   TIDB_USER=makenna_app
   TIDB_PASSWORD=
   TIDB_CA=
   TIDB_POOL_LIMIT=3
   TIDB_MAX_IDLE=1
   ```

   Keep `TIDB_CA` empty when the runtime trust store already contains TiDB Cloud's
   CA. If a custom PEM bundle is required, paste it as one env value; literal `\n`
   sequences are converted to real newlines by `tidb-client.js`.

6. Keep `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DEVELOPER_JWT_SECRET`,
   `CHILD_SESSION_SECRET`, `APP_URL`, and the Gmail variables configured. Keep
   `DATA_STORE=supabase` during shadow testing.

## Phase 5 — Shadow run (pending manual execution)

Never point the production deployment at TiDB while real children are writing.

- [ ] Re-run `supabase-schema.sql` in Supabase and confirm `sync_operations` exists.
- [ ] Seed only throwaway accounts and support requests in both stores.
- [ ] Run a preview/local deployment with `DATA_STORE=tidb` and the throwaway seed data.
- [ ] Compare reads for registration, login, sync pull/push, support list, and developer list.
- [ ] Compare write effects for a throwaway Child ID; verify no hash or token leaks.
- [ ] Verify replayed push/delete with one `operationId` writes only once.
- [ ] Verify rate-limit counters and reset-token replay behaviour against TiDB.
- [ ] Verify the dead-letter/overflow UI shows pending and failed changes.
- [ ] Keep Supabase authoritative and its env vars unchanged during this phase.

## Phase 6 — Cutover and rollback (pending explicit approval)

Cutover:

- [ ] Obtain explicit cutover approval.
- [ ] Freeze writes briefly, snapshot both stores, and reconcile any differences.
- [ ] Set `DATA_STORE=tidb` in Vercel and redeploy.
- [ ] Smoke test registration, login, offline queue replay, PIN reset, parent verification,
      support submit, temp password issue/mail, developer login, and tutor opt-in.
- [ ] Watch API error rates, 401/429 counts, and sync failures.
- [ ] Keep Supabase configured and read-only for at least one verification window.

Rollback:

- [ ] **Before TiDB has accepted writes**, `DATA_STORE=supabase` plus redeploy is enough.
- [ ] **After TiDB has accepted writes**, stop writes first. Export changed rows from
      TiDB, reconcile them into Supabase (including `sync_operations` and rate-limit
      state), verify the reconciliation, and only then switch `DATA_STORE` back.
- [ ] Do not delete Supabase env vars until the TiDB path is confirmed stable.
- [ ] Preserve the TiDB export until the rollback verification window closes.

## Validation commands

```bash
node scripts/prebuild-check.js
npm run lint
npm test -- --run
npm run build
git diff --check
```

Stage only intended files; never `git add -A`. Do not commit the root PNGs or the
unrelated NavigationCards/UI styling work without confirmation. Do not deploy,
provision cloud resources, or change Vercel settings as part of this local work.
