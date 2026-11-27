import {
  DEVELOPER_EMAIL,
  createSessionToken,
  createResetToken,
  verifySessionToken,
  verifyResetToken,
  verifyDeveloperPassword,
  saveDeveloperPassword,
  validateStrongPassword,
  recordResetToken,
  consumeResetToken,
  isDeveloperRateLimited,
  recordDeveloperFailure,
  clearDeveloperFailures,
} from './_lib/developer-auth.js';
import { sendMail } from './_lib/mailer.js';
import { json, readBody, requirePost, withErrors } from './_lib/http.js';

const rateLimited = (res, message) => json(res, 429, {
  success: false,
  error: `${message} Please wait 15 minutes and try again.`,
});

const handler = async (req, res) => {
  requirePost(req, res);
  const { action, email, password, token, newPassword } = readBody(req);

  try {
    if (action === 'login') {
      if (await isDeveloperRateLimited(req, 'dev-login', DEVELOPER_EMAIL)) {
        return rateLimited(res, 'Too many sign-in attempts.');
      }
      const valid = await verifyDeveloperPassword(email, password);
      if (!valid) {
        await recordDeveloperFailure(req, 'dev-login', DEVELOPER_EMAIL);
        return json(res, 401, { success: false, error: 'Invalid developer email or password.' });
      }
      await clearDeveloperFailures(req, 'dev-login', DEVELOPER_EMAIL);
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
      if (await isDeveloperRateLimited(req, 'dev-reset', DEVELOPER_EMAIL)) {
        return rateLimited(res, 'Too many reset requests.');
      }
      // A reset link is only ever generated and mailed for the configured mailbox.
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (normalizedEmail === DEVELOPER_EMAIL.toLowerCase() && process.env.APP_URL) {
        const resetToken = createResetToken();
        await recordResetToken(resetToken);
        const origin = process.env.APP_URL;
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
      await recordDeveloperFailure(req, 'dev-reset', DEVELOPER_EMAIL);
      return json(res, 200, {
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    if (action === 'reset') {
      if (!verifyResetToken(token)) {
        return json(res, 400, { success: false, error: 'This reset link is invalid or has expired.' });
      }
      if (!validateStrongPassword(newPassword)) {
        return json(res, 400, {
          success: false,
          error: 'Use at least 12 characters with upper case, lower case, a number and a symbol.',
        });
      }
      // Consume atomically before saving so concurrent replays cannot reuse the
      // link. If saving fails, restore the token for a clean retry.
      if (!(await consumeResetToken(token))) {
        return json(res, 400, { success: false, error: 'This reset link is invalid or has expired.' });
      }
      try {
        await saveDeveloperPassword(newPassword);
      } catch (error) {
        await recordResetToken(token);
        throw error;
      }
      return json(res, 200, { success: true });
    }

    return json(res, 400, { success: false, error: 'Unknown action' });
  } catch (error) {
    console.error('Developer auth error:', error.message);
    return json(res, 500, { success: false, error: 'Developer authentication is temporarily unavailable.' });
  }
};

export default withErrors(handler);
