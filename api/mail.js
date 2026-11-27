import { verifySessionToken, DEVELOPER_EMAIL } from './_lib/developer-auth.js';
import {
  getAccountRow,
  hasVerifiedRecoveryRequest,
  normalizeChildId,
  requireServerClient,
  validateChildId,
  verifyStoredCredential,
} from './_lib/child-auth.js';
import { sendMail } from './_lib/mailer.js';
import { HttpError, json, readBody, requirePost, withErrors } from './_lib/http.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const handler = async (req, res) => {
  requirePost(req, res);
  const { action, childId, parentEmail, tempPassword, sessionToken } = readBody(req);

  if (action !== 'send_temp_password') {
    return json(res, 400, { success: false, error: 'Unknown action' });
  }

  // Only an authenticated developer session can mail a recovery credential.
  const session = verifySessionToken(sessionToken);
  if (!session || session.email !== DEVELOPER_EMAIL.toLowerCase()) {
    throw new HttpError(401, 'Developer session is invalid. Please sign in again.');
  }

  const normalizedChildId = normalizeChildId(childId);
  const normalizedEmail = typeof parentEmail === 'string' ? parentEmail.trim().toLowerCase() : '';
  if (!validateChildId(normalizedChildId) || !EMAIL_PATTERN.test(normalizedEmail)) {
    throw new HttpError(400, 'A valid Child ID and parent email are required.');
  }
  if (typeof tempPassword !== 'string' || tempPassword.length < 8 || tempPassword.length > 128) {
    throw new HttpError(400, 'That temporary password is invalid.');
  }

  // The mail endpoint must not become a shortcut around parent verification:
  // confirm the credential was actually issued for this verified child/parent
  // pair before sending it anywhere.
  const client = requireServerClient();
  const row = await getAccountRow(client, normalizedChildId);
  if (!row || row.deleted_at || row.parent_email?.toLowerCase() !== normalizedEmail) {
    throw new HttpError(404, 'No verified recovery request was found for that Child ID and parent email.');
  }
  const temp = verifyStoredCredential(tempPassword, row.temp_password_hash);
  if (
    !temp.valid
    || !row.temp_password_expires_at
    || Date.parse(row.temp_password_expires_at) <= Date.now()
  ) {
    throw new HttpError(400, 'That temporary password is invalid or has expired.');
  }
  const verified = await hasVerifiedRecoveryRequest(client, normalizedChildId, normalizedEmail);
  if (!verified) {
    throw new HttpError(409, 'A verified recovery request is required before a temporary password can be mailed.');
  }

  try {
    await sendMail({
      to: normalizedEmail,
      subject: `Makenna Lab login help for ${normalizedChildId}`,
      text: [
        'Hello,',
        '',
        `A developer approved your support request for child ID ${normalizedChildId}.`,
        `Your one-time password is: ${tempPassword}`,
        '',
        'Log in with this child ID and the one-time password. You will be asked to choose a new PIN or password before continuing.',
        'This password expires in 30 minutes and can only be used until you set a new credential.',
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
    });
    return json(res, 200, { success: true });
  } catch (error) {
    console.error('Temporary password mail failed:', error.message);
    return json(res, 502, {
      success: false,
      error: 'Email could not be sent. Please try again later.',
    });
  }
};

export default withErrors(handler);
