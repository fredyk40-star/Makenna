-- Makenna Learning Lab - Supabase Schema Migration
-- Run this in your Supabase SQL editor
--
-- QUICK FIX for 401 errors: Run the GRANT statements below to fix
-- "permission denied for table child_accounts" for the anon role.
-- ==============================================================
-- Run these 2 lines FIRST if you have an existing table:
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_accounts TO anon;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_profiles TO anon;
-- ==============================================================

-- STEP 1: Create child_accounts table
CREATE TABLE child_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    child_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    pin_hash TEXT,
    pin_set BOOLEAN DEFAULT FALSE,
    avatar TEXT DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    progress JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    parent_id UUID REFERENCES auth.users
);

-- STEP 2: Create parent_profiles table  
CREATE TABLE parent_profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 3: Enable Row Level Security
ALTER TABLE child_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create secure policies for child_accounts
-- Public read: allows PIN-based child login from any device without parent auth
-- The anon key is sufficient — real security is the hashed PIN comparison in the browser
CREATE POLICY "Public can read accounts for PIN login" ON child_accounts FOR SELECT USING (true);
CREATE POLICY "Parents can view own children" ON child_accounts FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can create children" ON child_accounts FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents can update children" ON child_accounts FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Parents can delete children" ON child_accounts FOR DELETE USING (auth.uid() = parent_id);

-- STEP 4b: Additional policies for anonymous (anon key) access
-- If the app uses the anon key without Supabase Auth, these are needed:
CREATE POLICY "Anon can insert accounts" ON child_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update accounts" ON child_accounts FOR UPDATE USING (true);
CREATE POLICY "Anon can delete accounts" ON child_accounts FOR DELETE USING (true);

-- STEP 5: Create policies for parent_profiles
CREATE POLICY "Parents can view own profile" ON parent_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Anon can manage profiles" ON parent_profiles FOR ALL USING (true);

-- STEP 5b: Grant explicit permissions to anon role (fixes 401 errors)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_profiles TO anon;

-- STEP 6: Create indexes
CREATE INDEX idx_child_accounts_child_id ON child_accounts(child_id);
CREATE INDEX idx_child_accounts_parent_id ON child_accounts(parent_id);
CREATE INDEX idx_child_accounts_last_login ON child_accounts(last_login DESC);

-- STEP 7: Create developer_auth table for cross-device developer PIN sync
-- Allows developer to log in from any device with the same PIN
CREATE TABLE IF NOT EXISTS developer_auth (
    id TEXT PRIMARY KEY DEFAULT 'default',
    pin_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS and grant anon access
ALTER TABLE developer_auth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can read developer auth" ON developer_auth FOR SELECT USING (true);
CREATE POLICY "Anon can upsert developer auth" ON developer_auth FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update developer auth" ON developer_auth FOR UPDATE USING (true);
GRANT SELECT, INSERT, UPDATE ON public.developer_auth TO anon;

-- STEP 8: Create feature_flags table for cross-device feature flag sync
CREATE TABLE IF NOT EXISTS feature_flags (
    id TEXT PRIMARY KEY DEFAULT 'default',
    flags JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can read feature flags" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "Anon can upsert feature flags" ON feature_flags FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update feature flags" ON feature_flags FOR UPDATE USING (true);
GRANT SELECT, INSERT, UPDATE ON public.feature_flags TO anon;

-- STEP 9: Create developer_updates table for cross-device update management
CREATE TABLE IF NOT EXISTS developer_updates (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'feature',
    changelog TEXT DEFAULT '',
    target TEXT DEFAULT 'all',
    target_ids TEXT[] DEFAULT '{}',
    preview_children TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'preview',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE developer_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can read updates" ON developer_updates FOR SELECT USING (true);
CREATE POLICY "Anon can insert updates" ON developer_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update updates" ON developer_updates FOR UPDATE USING (true);
CREATE POLICY "Anon can delete updates" ON developer_updates FOR DELETE USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_updates TO anon;

-- STEP 10: Create developer_trash table for cross-device trash bin sync
CREATE TABLE IF NOT EXISTS developer_trash (
    child_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    pin_hash TEXT,
    avatar TEXT DEFAULT 'default',
    progress JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE developer_trash ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can read trash" ON developer_trash FOR SELECT USING (true);
CREATE POLICY "Anon can insert trash" ON developer_trash FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update trash" ON developer_trash FOR UPDATE USING (true);
CREATE POLICY "Anon can delete trash" ON developer_trash FOR DELETE USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_trash TO anon;

-- APP INSTRUCTIONS:
-- 1. Parents sign up with: supabase.auth.signUp({ email, password })
-- 2. Parents login with: supabase.auth.signInWithPassword({ email, password })
-- 3. Create child accounts with parent_id: supabase.auth.user().id
-- 4. For existing tables, run the ALTER POLICY commands or re-create policies as needed
-- 5. Developer PIN, feature flags, updates, and trash auto-sync to Supabase
