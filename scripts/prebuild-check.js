#!/usr/bin/env node
/**
 * Pre-build sanity checks for Makenna Learning Lab.
 * Fails fast on missing critical files or obviously broken source state.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'package.json',
  'index.html',
  'vite.config.js',
  'public/manifest.json',
  'src/main.jsx',
  'src/App.jsx',
  'src/routes/index.js',
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    failures.push(`Missing required file: ${file}`);
  }
}

const pkgPath = join(root, 'package.json');
if (existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (!pkg.dependencies?.react || !pkg.dependencies?.['react-dom']) {
      failures.push('package.json must declare react and react-dom dependencies');
    }
  } catch (error) {
    failures.push(`Invalid package.json: ${error.message}`);
  }
}

const srcDir = join(root, 'src');
if (existsSync(srcDir)) {
  const strayTempFiles = [];
  const clientSupabaseImports = [];
  const leakedServerSecrets = [];
  const deniedClientEnv = /VITE_(?:SUPABASE_|TIDB_|DEVELOPER_JWT_SECRET|CHILD_SESSION_SECRET|GEMINI_API_KEY|GMAIL_|SMTP_)/;
  const deniedServerEnv = /process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|TIDB_PASSWORD|TIDB_CA|DEVELOPER_JWT_SECRET|CHILD_SESSION_SECRET|GEMINI_API_KEY|GMAIL_|SMTP_)/;
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const relativePath = fullPath.replace(root + '\\', '').replace(root + '/', '');
      if (entry.name.endsWith('.tmp') || entry.name.endsWith('.bak')) {
        strayTempFiles.push(relativePath);
      }

      if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        const source = readFileSync(fullPath, 'utf8');
        // Credential hashes and child rows must never be read by browser code.
        // All cloud access goes through the serverless /api/* functions.
        if (/@supabase\/supabase-js|VITE_SUPABASE_(?:URL|ANON_KEY)/.test(source)) {
          clientSupabaseImports.push(relativePath);
        }
        // Tests may stub secret names; production browser code must never
        // reference a server secret or a VITE_ alias for one.
        if (!entry.name.includes('.test.') && (deniedClientEnv.test(source) || deniedServerEnv.test(source))) {
          leakedServerSecrets.push(relativePath);
        }
      }
    }
  };
  walk(srcDir);
  if (strayTempFiles.length) {
    console.warn(`Warning: stray temporary source files found: ${strayTempFiles.join(', ')}`);
  }
  if (clientSupabaseImports.length) {
    failures.push(
      `Browser code must use /api/* instead of Supabase: ${clientSupabaseImports.join(', ')}`,
    );
  }
  if (leakedServerSecrets.length) {
    failures.push(
      `Browser code must never reference server secrets: ${leakedServerSecrets.join(', ')}`,
    );
  }
}

if (failures.length) {
  console.error('\nPre-build check failed:\n');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  console.error('');
  process.exit(1);
}

console.log('Pre-build checks passed.');
