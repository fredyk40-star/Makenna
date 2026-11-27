-- Makenna cloud sync 400 fix
-- Run this in the Supabase SQL editor when uploads fail with HTTP 400 on
-- /rest/v1/child_accounts?on_conflict=child_id.
--
-- It fixes the two schema issues that produce that error:
--   1. missing columns added by the auth/recovery migration
--   2. missing UNIQUE constraint on child_id, which PostgREST requires for
--      on_conflict=child_id
--
-- Safe to re-run. If you have not run supabase-auth-recovery.sql yet, run that
-- as well so support_requests and developer password storage exist.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bring an older child_accounts table up to date.
ALTER TABLE public.child_accounts
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_set BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS temp_password_hash TEXT,
  ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS requires_credential_reset BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id);

-- Before adding the constraint, check for duplicate child IDs. If this query
-- returns rows, resolve those duplicates first:
--   SELECT child_id, COUNT(*)
--   FROM public.child_accounts
--   GROUP BY child_id
--   HAVING COUNT(*) > 1;

DO $$
DECLARE
  child_attnum smallint;
BEGIN
  SELECT attnum
    INTO child_attnum
    FROM pg_attribute
   WHERE attrelid = 'public.child_accounts'::regclass
     AND attname = 'child_id'
     AND NOT attisdropped;

  IF child_attnum IS NULL THEN
    RAISE EXCEPTION 'public.child_accounts.child_id does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'public.child_accounts'::regclass
       AND contype IN ('u', 'p')
       AND child_attnum = ANY(conkey)
  ) THEN
    ALTER TABLE public.child_accounts
      ADD CONSTRAINT child_accounts_child_id_key UNIQUE (child_id);
  END IF;
END $$;

-- 2. Ensure the anon client used by the SPA can perform the upsert.
-- These are development-only broad policies. Harden them with parent-scoped
-- policies before public launch.
ALTER TABLE public.child_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can read accounts for sync" ON public.child_accounts;
CREATE POLICY "Anon can read accounts for sync"
  ON public.child_accounts FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon can insert accounts" ON public.child_accounts;
CREATE POLICY "Anon can insert accounts"
  ON public.child_accounts FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update accounts" ON public.child_accounts;
CREATE POLICY "Anon can update accounts"
  ON public.child_accounts FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can delete accounts" ON public.child_accounts;
CREATE POLICY "Anon can delete accounts"
  ON public.child_accounts FOR DELETE TO anon
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_accounts TO anon;
