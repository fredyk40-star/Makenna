#!/usr/bin/env node
import crypto from 'node:crypto';

const readStdin = () => new Promise((resolve) => {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => resolve(input.trim()));
});

// Prefer piping the password (e.g. `cat secret.txt | node ...`) so it never
// appears in shell history or the process list. An argument is still accepted
// for backwards compatibility.
const password = process.argv[2] || (process.stdin.isTTY ? null : await readStdin());
if (!password) {
  console.error('Usage: node scripts/hash-developer-password.js < password.txt');
  console.error('       (you may also pass the password as an argument, but stdin is safer)');
  process.exit(1);
}

const salt = process.env.DEVELOPER_PASSWORD_SALT || crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');

console.log('Add these to your Vercel environment variables:');
console.log(`DEVELOPER_PASSWORD_HASH=${hash}`);
console.log(`DEVELOPER_PASSWORD_SALT=${salt}`);
