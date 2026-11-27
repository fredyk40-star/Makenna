-- Makenna auth + recovery migration
-- Run this in the Supabase SQL editor after supabase-phase5-sync.sql.
-- It adds parent recovery emails, PIN/password credentials, support requests,
-- and server-side developer password storage.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Child account recovery fields
ALTER TABLE public.child_accounts
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS temp_password_hash TEXT,
  ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS requires_credential_reset BOOLEAN DEFAULT FALSE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_child_accounts_parent_email
  ON public.child_accounts (lower(parent_email));

-- Developer password hash is written only by the serverless function with the
-- service-role key. The old PIN hash column is no longer required.
ALTER TABLE public.developer_auth
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_salt TEXT;

ALTER TABLE public.developer_auth ALTER COLUMN pin_hash DROP NOT NULL;

-- Remove browser access to developer secrets.
DROP POLICY IF EXISTS "Anon can read developer auth" ON public.developer_auth;
DROP POLICY IF EXISTS "Anon can upsert developer auth" ON public.developer_auth;
DROP POLICY IF EXISTS "Anon can update developer auth" ON public.developer_auth;
REVOKE ALL ON public.developer_auth FROM anon;

-- Parent support / forgot-PIN messages
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  developer_note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests (status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON public.support_requests (created_at DESC);
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Development-only access: the SPA has no server session for parents yet, so
-- anon keys may submit and read requests. Harden this before public launch.
DROP POLICY IF EXISTS "Anon can submit support requests" ON public.support_requests;
DROP POLICY IF EXISTS "Anon can read support requests" ON public.support_requests;
DROP POLICY IF EXISTS "Anon can update support requests" ON public.support_requests;

CREATE POLICY "Anon can submit support requests"
  ON public.support_requests FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can read support requests"
  ON public.support_requests FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can update support requests"
  ON public.support_requests FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.support_requests TO anon;

CREATE OR REPLACE FUNCTION public.touch_support_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_request_updated_at ON public.support_requests;
CREATE TRIGGER trg_support_request_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_support_request_updated_at();

-- NOTE: before production, replace broad anon policies on child_accounts and
-- support_requests with parent-scoped policies (auth.uid() = parent_id) or
-- move all writes behind serverless functions using the service-role key.
