import { verifySessionToken, DEVELOPER_EMAIL } from './_lib/developer-auth.js';
import { sendMail } from './_lib/mailer.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const json = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, error: 'Method not allowed' });
  }

  const { action, childId, parentEmail, tempPassword, sessionToken } = req.body || {};

  if (action !== 'send_temp_password') {
    return json(res, 400, { success: false, error: 'Unknown action' });
  }

  // Only an authenticated developer session can issue a one-time password.
  const session = verifySessionToken(sessionToken);
  if (!session || session.email !== DEVELOPER_EMAIL.toLowerCase()) {
    return json(res, 401, { success: false, error: 'Developer session is invalid. Please sign in again.' });
  }

  if (!EMAIL_PATTERN.test(String(parentEmail || '').trim())) {
    return json(res, 400, { success: false, error: 'A valid parent email is required.' });
  }

  try {
    await sendMail({
      to: parentEmail.trim().toLowerCase(),
      subject: `Makenna Lab login help for ${childId}`,
      text: [
        'Hello,',
        '',
        `A developer approved your support request for child ID ${childId}.`,
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
}
