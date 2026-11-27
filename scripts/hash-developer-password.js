#!/usr/bin/env node
import crypto from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-developer-password.js "your-strong-password"');
  process.exit(1);
}

const salt = process.env.DEVELOPER_PASSWORD_SALT || crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');

console.log('Add these to your Vercel environment variables:');
console.log(`DEVELOPER_PASSWORD_HASH=${hash}`);
console.log(`DEVELOPER_PASSWORD_SALT=${salt}`);
