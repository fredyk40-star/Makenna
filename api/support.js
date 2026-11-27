import crypto from 'node:crypto';
import {
  getAccountRow,
  hashCredentialStrong,
  normalizeChildId,
  requireServerClient,
  validateEmail,
  verifyStoredCredential,
} from './_lib/child-auth.js';
import { verifySessionToken } from './_lib/developer-auth.js';
import {
  isRateLimited,
  recordFailure,
  clearFailures,
} from './_lib/rate-limit.js';
import { isMailConfigured, sendMail } from './_lib/mailer.js';
import { HttpError, json, readBody, requirePost, withErrors } from './_lib/http.js';

const MAX_MESSAGE_LENGTH = 1000;
const CODE_LENGTH = 6;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const ALLOWED_STATUS = ['open', 'reviewing', 'resolved'];
const GENERIC_REPLY = 'If those details match an account, your request has been received.';

const toClientRequest = (row) => ({
  id: row.id,
  childId: row.child_id,
  parentEmail: row.parent_email,
  message: row.message,
  status: row.status || 'open',
  developerNote: row.developer_note || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at || row.created_at,
});

const requireDeveloper = (body) => {
  if (!verifySessionToken(body.developerToken || body.sessionToken)) {
    throw new HttpError(401, 'Developer session is invalid. Please sign in again.');
  }
};

const validateMessage = (message) => {
  const trimmed = typeof message === 'string' ? message.trim() : '';
  if (trimmed.length < 5 || trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, `Please write a short message (5-${MAX_MESSAGE_LENGTH} characters).`);
  }
  return trimmed;
};

const validateIdentity = (body) => {
  const childId = normalizeChildId(body.childId);
  const parentEmail = typeof body.parentEmail === 'string' ? body.parentEmail.trim().toLowerCase() : '';
  if (!childId || !validateEmail(parentEmail)) {
    throw new HttpError(400, 'Enter a valid Child ID and parent email.');
  }
  return { childId, parentEmail };
};

/** Always generic so callers cannot confirm which child IDs or emails exist. */
const matchedAccount = async (client, childId, parentEmail) => {
  const account = await getAccountRow(client, childId);
  if (!account || account.deleted_at || !account.parent_email
    || account.parent_email.toLowerCase() !== parentEmail) {
    return null;
  }
  return account;
};

async function sendVerification(req, client, body) {
  const { childId, parentEmail } = validateIdentity(body);
  if (await isRateLimited(req, parentEmail, client, 'support-verify')) {
    throw new HttpError(429, 'Too many verification requests. Please wait 15 minutes and try again.');
  }
  await recordFailure(req, parentEmail, client, 'support-verify');

  const account = await matchedAccount(client, childId, parentEmail);
  const response = { message: 'If those details match an account, a code has been sent.' };

  if (account) {
    const code = String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0');
    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
    const { error } = await client.from('parent_email_verifications').upsert({
      child_id: childId,
      parent_email: parentEmail,
      code_hash: hashCredentialStrong(code),
      expires_at: expiresAt,
      attempts: 0,
      created_at: new Date().toISOString(),
    }, { onConflict: 'child_id,parent_email' });
    if (error) throw new Error(error.message);

    if (isMailConfigured()) {
      try {
        await sendMail({
          to: parentEmail,
          subject: 'Makenna Lab parent email verification',
          text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
        });
      } catch (error) {
        console.error('Verification mail failed:', error.message);
        throw new HttpError(502, 'The code could not be sent. Please try again later.');
      }
    } else if (process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production') {
      throw new HttpError(503, 'Email verification is not configured. Please contact support.');
    } else {
      // Local development has no SMTP; expose the code only in the response.
      response.devCode = code;
    }
  }

  return response;
}

async function consumeVerification(client, childId, parentEmail, code) {
  if (!/^\d{6}$/.test(String(code || ''))) return false;
  const { data, error } = await client
    .from('parent_email_verifications')
    .select('id, code_hash, expires_at, attempts')
    .eq('child_id', childId)
    .eq('parent_email', parentEmail)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return false;
  if (Date.parse(data.expires_at) <= Date.now() || Number(data.attempts) >= MAX_CODE_ATTEMPTS) {
    await client.from('parent_email_verifications').delete().eq('id', data.id);
    return false;
  }

  const { valid } = verifyStoredCredential(String(code), data.code_hash);
  if (!valid) {
    const { error: updateError } = await client
      .from('parent_email_verifications')
      .update({ attempts: Number(data.attempts) + 1 })
      .eq('id', data.id);
    if (updateError) throw new Error(updateError.message);
    return false;
  }

  // Single use: delete the challenge as soon as it succeeds.
  const { error: deleteError } = await client
    .from('parent_email_verifications')
    .delete()
    .eq('id', data.id);
  if (deleteError) throw new Error(deleteError.message);
  return true;
}

async function submit(req, client, body) {
  const { childId, parentEmail } = validateIdentity(body);
  const message = validateMessage(body.message);
  if (await isRateLimited(req, parentEmail, client, 'support-submit')) {
    throw new HttpError(429, 'Too many support requests. Please wait 15 minutes and try again.');
  }
  await recordFailure(req, parentEmail, client, 'support-submit');

  const account = await matchedAccount(client, childId, parentEmail);
  // A non-matching identity has no issued code, so it fails with exactly the
  // same generic error as a wrong/expired code. This prevents account
  // enumeration without creating phantom support requests.
  const verified = !!account
    && await consumeVerification(client, childId, parentEmail, body.verificationCode);
  if (!verified) {
    throw new HttpError(400, 'That verification code is invalid or has expired. Request a new one.');
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from('support_requests')
    .insert({
      id: crypto.randomUUID(),
      child_id: account.child_id,
      parent_email: parentEmail,
      message,
      status: 'open',
      developer_note: '',
      parent_verified: true,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  await clearFailures(req, parentEmail, client, 'support-submit');
  return { request: toClientRequest(data), message: GENERIC_REPLY };
}

async function list(client) {
  const { data, error } = await client
    .from('support_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { requests: (data || []).map(toClientRequest) };
}

async function update(client, body) {
  if (!ALLOWED_STATUS.includes(body.status)) {
    throw new HttpError(400, `Unsupported status: ${body.status}`);
  }
  const { error } = await client
    .from('support_requests')
    .update({
      status: body.status,
      developer_note: typeof body.developerNote === 'string' ? body.developerNote.slice(0, 1000) : '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id);
  if (error) throw new Error(error.message);
  return { id: body.id };
}

async function remove(client, body) {
  const { error } = await client.from('support_requests').delete().eq('id', body.id);
  if (error) throw new Error(error.message);
  return { id: body.id };
}

async function syncToCloud(client, body) {
  const requests = Array.isArray(body.requests) ? body.requests.slice(0, 500) : [];
  if (!requests.length) return { count: 0 };

  // Verification state is server-owned: never let a browser grant itself a
  // verified recovery request through an offline sync payload.
  const ids = requests.map(request => request.id).filter(Boolean);
  const { data: existing } = ids.length
    ? await client.from('support_requests').select('id, parent_verified').in('id', ids)
    : { data: [] };
  const verifiedById = new Map((existing || []).map(row => [row.id, !!row.parent_verified]));

  const rows = requests.filter(request => verifiedById.has(request.id)).map((request) => ({
    id: request.id,
    child_id: request.childId,
    parent_email: request.parentEmail,
    message: validateMessage(request.message),
    status: ALLOWED_STATUS.includes(request.status) ? request.status : 'open',
    developer_note: request.developerNote || '',
    parent_verified: verifiedById.get(request.id),
    created_at: request.createdAt || new Date().toISOString(),
    updated_at: request.updatedAt || new Date().toISOString(),
  }));
  if (!rows.length) return { count: 0 };

  const { error } = await client
    .from('support_requests')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  return { count: rows.length };
}

const handler = async (req, res) => {
  requirePost(req, res);
  const body = readBody(req);
  const client = requireServerClient();

  switch (body.action) {
    case 'send_verification': {
      const result = await sendVerification(req, client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'submit': {
      const result = await submit(req, client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'list': {
      requireDeveloper(body);
      const result = await list(client);
      return json(res, 200, { success: true, ...result });
    }
    case 'update': {
      requireDeveloper(body);
      const result = await update(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'delete': {
      requireDeveloper(body);
      const result = await remove(client, body);
      return json(res, 200, { success: true, ...result });
    }
    case 'sync': {
      requireDeveloper(body);
      const result = await syncToCloud(client, body);
      return json(res, 200, { success: true, ...result });
    }
    default:
      return json(res, 400, { success: false, error: 'Unknown action' });
  }
};

export default withErrors(handler);
