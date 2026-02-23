const { Resend } = require('resend');
const { RESEND_API_KEY, RESEND_FROM } = require('../config/env');

if (!RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY is not set. Emails will be skipped.');
}

function getResendClient() {
  if (!RESEND_API_KEY) return null;
  return new Resend(RESEND_API_KEY);
}

async function sendPasswordResetCode({ to, code }) {
  if (!RESEND_API_KEY) {
    return { skipped: true };
  }

  const subject = 'Your password reset code';
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Password Reset</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 4px;">${code}</h1>
      <p>This code expires in 15 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  const resend = getResendClient();
  await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    html,
  });

  return { skipped: false };
}

async function sendPasswordResetEmail({ to, code }) {
  return sendPasswordResetCode({ to, code });
}

module.exports = {
  sendPasswordResetCode,
  sendPasswordResetEmail,
};
