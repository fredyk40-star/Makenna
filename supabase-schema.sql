-- Makenna Learning Lab - canonical Supabase schema (idempotent, least privilege)
--
-- Run this ONCE in the Supabase SQL Editor. It is safe to re-run on a fresh or
-- partially migrated project. It replaces the older scripts:
--   src/data/supabase-migration.sql
--   supabase-phase5-sync.sql
--   supabase-auth-recovery.sql
--   supabase-cloud-sync-fix.sql
--
-- All privileged access now goes through Vercel functions using the service
-- role key. The browser has NO table grants: credential hashes, support
-- messages and developer data are never readable with the anon key.
--
-- Required Vercel server env vars:
--   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEVELOPER_JWT_SECRET,
--   CHILD_SESSION_SECRET (or DEVELOPER_JWT_SECRET as fallback)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Tables and columns (additive only; existing data is preserved)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.child_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  pin_hash TEXT,
  pin_set BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT,
  password_set BOOLEAN NOT NULL DEFAULT FALSE,
  parent_email TEXT,
  temp_password_hash TEXT,
  temp_password_expires_at TIMESTAMPTZ,
  requires_credential_reset BOOLEAN NOT NULL DEFAULT FALSE,
  avatar TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  parent_id UUID REFERENCES auth.users(id),
  version BIGINT NOT NULL DEFAULT 0
);

ALTER TABLE public.child_accounts
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS child_id TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS pin_set BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_set BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS temp_password_hash TEXT,
  ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requires_credential_reset BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- Older projects stored these as `timestamp without time zone`. Normalise them
-- so server-supplied ISO timestamps and client merge logic compare correctly.
DO $$
DECLARE
  column_record record;
BEGIN
  FOR column_record IN
    SELECT column_name
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'child_accounts'
       AND data_type = 'timestamp without time zone'
       AND column_name IN ('created_at', 'updated_at', 'last_login', 'deleted_at', 'temp_password_expires_at')
  LOOP
    EXECUTE format(
      'ALTER TABLE public.child_accounts ALTER COLUMN %I TYPE TIMESTAMPTZ USING %I AT TIME ZONE ''UTC''',
      column_record.column_name, column_record.column_name
    );
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS child_accounts_child_id_key
  ON public.child_accounts (child_id);
CREATE INDEX IF NOT EXISTS idx_child_accounts_updated_at
  ON public.child_accounts (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_accounts_deleted_at
  ON public.child_accounts (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_child_accounts_parent_email
  ON public.child_accounts (lower(parent_email));

-- The old trigger overwrote every synced updated_at with NOW(), defeating
-- deterministic conflict resolution. Serverless functions set it explicitly.
DROP TRIGGER IF EXISTS trg_child_account_updated_at ON public.child_accounts;

CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  developer_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_requests
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS child_id TEXT,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS developer_note TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests (status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at
  ON public.support_requests (created_at DESC);

-- Serverless writes set updated_at explicitly for deterministic merge, so no
-- trigger should rewrite it. Drop any legacy trigger left by older scripts.
DROP TRIGGER IF EXISTS trg_support_request_updated_at ON public.support_requests;

-- Developer data. Only the service role may touch these tables.
CREATE TABLE IF NOT EXISTS public.developer_auth (
  id TEXT PRIMARY KEY DEFAULT 'default',
  email TEXT,
  pin_hash TEXT,
  password_hash TEXT,
  password_salt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.developer_auth
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_salt TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.developer_auth ALTER COLUMN pin_hash DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id TEXT PRIMARY KEY DEFAULT 'default',
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.developer_updates (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'feature',
  changelog TEXT NOT NULL DEFAULT '',
  target TEXT NOT NULL DEFAULT 'all',
  target_ids TEXT[] NOT NULL DEFAULT '{}',
  preview_children TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'preview',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.developer_trash (
  child_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'default',
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sync_state (
  child_id TEXT PRIMARY KEY REFERENCES public.child_accounts(child_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  last_sync TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.parent_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. Least-privilege access
-- ---------------------------------------------------------------------------

ALTER TABLE public.child_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_trash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;

-- Remove every legacy policy, including permissive anon and PUBLIC policies.
-- Permissive policies combine with OR, so a single broad policy defeats the
-- rest. Serverless functions use service_role, which bypasses RLS.
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN (
         'child_accounts', 'support_requests', 'developer_auth',
         'feature_flags', 'developer_updates', 'developer_trash',
         'sync_state', 'parent_profiles'
       )
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  END LOOP;
END $$;

REVOKE ALL ON TABLE public.child_accounts, public.support_requests,
  public.developer_auth, public.feature_flags, public.developer_updates,
  public.developer_trash, public.sync_state, public.parent_profiles
  FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.child_accounts, public.support_requests,
  public.developer_auth, public.feature_flags, public.developer_updates,
  public.developer_trash, public.sync_state, public.parent_profiles
  TO service_role;

-- Note: the anon key is no longer needed by the app. Remove
-- VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from client env after deploying
-- the serverless functions.
