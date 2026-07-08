-- Makenna Learning Lab - Supabase Schema Migration
-- Run this in your Supabase SQL editor

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
CREATE POLICY "Parents can view own children" ON child_accounts FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can create children" ON child_accounts FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents can update children" ON child_accounts FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Parents can delete children" ON child_accounts FOR DELETE USING (auth.uid() = parent_id);

-- STEP 5: Create policies for parent_profiles
CREATE POLICY "Parents can view own profile" ON parent_profiles FOR SELECT USING (auth.uid() = id);

-- STEP 6: Create indexes
CREATE INDEX idx_child_accounts_child_id ON child_accounts(child_id);
CREATE INDEX idx_child_accounts_parent_id ON child_accounts(parent_id);
CREATE INDEX idx_child_accounts_last_login ON child_accounts(last_login DESC);

-- APP INSTRUCTIONS:
-- 1. Parents sign up with: supabase.auth.signUp({ email, password })
-- 2. Parents login with: supabase.auth.signInWithPassword({ email, password })
-- 3. Create child accounts with parent_id: supabase.auth.user().id