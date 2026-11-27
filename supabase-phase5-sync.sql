-- Makenna Learning Lab — Phase 5 offline-first sync migration
-- Run this after supabase-migration.sql. It is safe to re-run.

-- 1. Schema additions used by deterministic conflict resolution and tombstones.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.child_accounts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id);

ALTER TABLE public.child_accounts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_child_accounts_updated_at
  ON public.child_accounts (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_accounts_deleted_at
  ON public.child_accounts (deleted_at) WHERE deleted_at IS NOT NULL;

-- Keep the remote row's version in step with local writes.
CREATE OR REPLACE FUNCTION public.touch_child_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_child_account_updated_at ON public.child_accounts;
CREATE TRIGGER trg_child_account_updated_at
  BEFORE UPDATE ON public.child_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_child_account_updated_at();

-- 2. Syncable family tables (teacher/classroom data can be exported offline;
-- these tables are ready when a parent-authenticated backend is introduced).
CREATE TABLE IF NOT EXISTS public.sync_state (
  child_id TEXT PRIMARY KEY REFERENCES public.child_accounts(child_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  version BIGINT DEFAULT 0 NOT NULL
);
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

-- 3. RLS guidance.
-- IMPORTANT: the current app logs children in with a hashed PIN using the
-- Supabase anon key. That requires a public SELECT policy, which also exposes
-- pin_hash. Before production, move PIN verification to a server function and
-- remove the public read policy.
--
-- The broad anon INSERT/UPDATE/DELETE policies in supabase-migration.sql let
-- any client overwrite any child row. Replace them with parent-scoped access
-- once Supabase Auth is wired. Uncomment the block below at that point:
--
-- DROP POLICY IF EXISTS "Anon can insert accounts" ON public.child_accounts;
-- DROP POLICY IF EXISTS "Anon can update accounts" ON public.child_accounts;
-- DROP POLICY IF EXISTS "Anon can delete accounts" ON public.child_accounts;
-- DROP POLICY IF EXISTS "Public can read accounts for PIN login" ON public.child_accounts;
-- DROP POLICY IF EXISTS "Parents can sync own children" ON public.child_accounts;
-- CREATE POLICY "Parents can sync own children" ON public.child_accounts
--   FOR ALL USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
-- CREATE POLICY "Parents can read own sync state" ON public.sync_state
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM public.child_accounts c
--       WHERE c.child_id = sync_state.child_id AND c.parent_id = auth.uid()
--     )
--   );

-- Until the hardened block is enabled, cloud writes are available to the anon
-- role but every local change is also queued and can be exported as a school
-- bundle, so an outage or policy change never loses learning data.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_state TO authenticated;
