import nodemailer from 'nodemailer';

let cachedTransporter = null;

export function isMailConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransporter() {
  if (!isMailConfigured()) {
    throw new Error('Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
  }
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return cachedTransporter;
}

export async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.GMAIL_FROM || process.env.GMAIL_USER,
    to,
    subject,
    text,
    html,
  });
  return true;
}
