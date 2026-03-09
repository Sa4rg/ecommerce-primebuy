const sgMail = require('@sendgrid/mail');
const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = require('../../config/env');

function createSendgridEmailSender() {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is missing');
  }
  if (!SENDGRID_FROM_EMAIL) {
    throw new Error('SENDGRID_FROM_EMAIL is missing');
  }

  sgMail.setApiKey(SENDGRID_API_KEY);

  async function sendPasswordResetCode({ to, code }) {
    const msg = {
      to,
      from: SENDGRID_FROM_EMAIL,
      subject: 'Your Prime Buy password reset code',
      text: `Your password reset code is: ${code}\n\nThis code expires soon.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Password reset</h2>
          <p>Use this code to reset your password:</p>
          <p style="font-size:24px;font-weight:bold;letter-spacing:2px">${code}</p>
          <p>If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    };

    await sgMail.send(msg);
  }

  return { sendPasswordResetCode };
}

module.exports = { createSendgridEmailSender };