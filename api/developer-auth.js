import {
  DEVELOPER_EMAIL,
  createSessionToken,
  createResetToken,
  verifySessionToken,
  verifyResetToken,
  verifyDeveloperPassword,
  saveDeveloperPassword,
  validateStrongPassword,
} from './_lib/developer-auth.js';
import { sendMail } from './_lib/mailer.js';

const json = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, error: 'Method not allowed' });
  }

  const { action, email, password, token, newPassword } = req.body || {};

  try {
    if (action === 'login') {
      const valid = await verifyDeveloperPassword(email, password);
      if (!valid) {
        return json(res, 401, { success: false, error: 'Invalid developer email or password.' });
      }
      return json(res, 200, {
        success: true,
        token: createSessionToken(),
        email: DEVELOPER_EMAIL.toLowerCase(),
      });
    }

    if (action === 'verify') {
      const session = verifySessionToken(token);
      return json(res, 200, { success: true, valid: !!session });
    }

    if (action === 'request-reset') {
      // A reset link is only ever generated and mailed for the configured mailbox.
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (normalizedEmail === DEVELOPER_EMAIL.toLowerCase()) {
        const resetToken = createResetToken();
        const origin = process.env.APP_URL || `https://${req.headers.host}`;
        const link = `${origin.replace(/\/$/, '')}/developer-reset-password?token=${encodeURIComponent(resetToken)}`;
        try {
          await sendMail({
            to: DEVELOPER_EMAIL,
            subject: 'Makenna Lab developer password reset',
            text: `Use this link within 1 hour to reset your developer password:\n\n${link}\n\nIf you did not request this, ignore this email.`,
          });
        } catch (error) {
          // Do not reveal delivery details to the requester.
          console.error('Developer reset mail failed:', error.message);
        }
      }
      return json(res, 200, {
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    if (action === 'reset') {
      const reset = verifyResetToken(token);
      if (!reset) {
        return json(res, 400, { success: false, error: 'This reset link is invalid or has expired.' });
      }
      if (!validateStrongPassword(newPassword)) {
        return json(res, 400, {
          success: false,
          error: 'Use at least 12 characters with upper case, lower case, a number and a symbol.',
        });
      }
      await saveDeveloperPassword(newPassword);
      return json(res, 200, { success: true });
    }

    return json(res, 400, { success: false, error: 'Unknown action' });
  } catch (error) {
    console.error('Developer auth error:', error.message);
    return json(res, 500, { success: false, error: error.message });
  }
}
