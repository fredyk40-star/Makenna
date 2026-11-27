-- Makenna Learning Lab - canonical TiDB Cloud schema (MySQL-compatible mode)
--
-- This file is for TiDB Cloud's MySQL protocol only. Do not use the
-- PostgreSQL-compatible preview, and do not run Supabase/PostgreSQL SQL here.
-- It is safe to re-run: every statement is additive or IF NOT EXISTS.
--
-- The browser never connects to this database. All access goes through Vercel
-- serverless functions using a restricted application user. Credentials and CA
-- certificates are supplied through server-only environment variables.
--
-- Excluded intentionally: sync_state and parent_profiles (no runtime references),
-- and any auth.users foreign key (Supabase Auth is not used by the app).

-- Bootstrap the app database and select it before creating unqualified tables.
-- Run this file with an admin/DDL-capable account, not the runtime app user.
CREATE DATABASE IF NOT EXISTS makenna CHARACTER SET utf8mb4;
USE makenna;

-- Create the restricted app user separately. Never commit real credentials.
-- CREATE USER IF NOT EXISTS 'makenna_app'@'%' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON makenna.* TO 'makenna_app'@'%';
-- FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS child_accounts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  child_id VARCHAR(32) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  pin_hash TEXT NULL,
  pin_set TINYINT(1) NOT NULL DEFAULT 0,
  password_hash TEXT NULL,
  password_set TINYINT(1) NOT NULL DEFAULT 0,
  parent_email VARCHAR(320) NULL,
  temp_password_hash TEXT NULL,
  temp_password_expires_at DATETIME(6) NULL,
  requires_credential_reset TINYINT(1) NOT NULL DEFAULT 0,
  avatar VARCHAR(100) NOT NULL DEFAULT 'default',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_login DATETIME(6) NULL,
  progress JSON NULL,
  settings JSON NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  deleted_at DATETIME(6) NULL,
  token_revoked_at DATETIME(6) NULL,
  version BIGINT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_child_accounts_child_id (child_id)
);

CREATE INDEX IF NOT EXISTS idx_child_accounts_updated_at
  ON child_accounts (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_accounts_deleted_at
  ON child_accounts (deleted_at);
CREATE INDEX IF NOT EXISTS idx_child_accounts_parent_email
  ON child_accounts (parent_email);

CREATE TABLE IF NOT EXISTS support_requests (
  id CHAR(36) NOT NULL PRIMARY KEY,
  child_id VARCHAR(32) NOT NULL,
  parent_email VARCHAR(320) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  developer_note TEXT NOT NULL,
  parent_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests (status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at
  ON support_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_identity
  ON support_requests (child_id, parent_email, parent_verified, created_at);

CREATE TABLE IF NOT EXISTS developer_auth (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  email VARCHAR(320) NULL,
  pin_hash TEXT NULL,
  password_hash TEXT NULL,
  password_salt TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  flags JSON NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS developer_updates (
  id CHAR(36) NOT NULL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'feature',
  changelog TEXT NOT NULL,
  target VARCHAR(50) NOT NULL DEFAULT 'all',
  target_ids JSON NULL,
  preview_children JSON NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'preview',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE INDEX IF NOT EXISTS idx_developer_updates_created_at
  ON developer_updates (created_at DESC);

CREATE TABLE IF NOT EXISTS developer_trash (
  child_id VARCHAR(32) NOT NULL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  avatar VARCHAR(100) NOT NULL DEFAULT 'default',
  progress JSON NULL,
  settings JSON NULL,
  created_at DATETIME(6) NULL,
  deleted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE INDEX IF NOT EXISTS idx_developer_trash_deleted_at
  ON developer_trash (deleted_at DESC);

-- Client operation ids are stable retry keys, independent of child_accounts.version.
-- Replaying a delete or push with the same key returns the recorded response.
CREATE TABLE IF NOT EXISTS sync_operations (
  child_id VARCHAR(32) NOT NULL,
  operation_id VARCHAR(128) NOT NULL,
  action VARCHAR(20) NOT NULL,
  response JSON NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (child_id, operation_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_operations_created_at
  ON sync_operations (created_at);

-- Shared counters replace the Supabase PL/pgSQL RPC. The adapter performs the
-- atomic INSERT ... ON DUPLICATE KEY UPDATE on this table.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  limit_key VARCHAR(512) NOT NULL PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  first_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_first_at
  ON auth_rate_limits (first_at);

CREATE TABLE IF NOT EXISTS developer_reset_tokens (
  jti VARCHAR(255) NOT NULL PRIMARY KEY,
  email VARCHAR(320) NULL,
  expires_at DATETIME(6) NOT NULL,
  used_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE INDEX IF NOT EXISTS idx_developer_reset_tokens_used_at
  ON developer_reset_tokens (used_at);

CREATE TABLE IF NOT EXISTS parent_email_verifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  child_id VARCHAR(32) NOT NULL,
  parent_email VARCHAR(320) NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_parent_email_verifications_identity (child_id, parent_email)
);

CREATE INDEX IF NOT EXISTS idx_parent_email_verifications_expires_at
  ON parent_email_verifications (expires_at);
