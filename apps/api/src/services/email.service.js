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

  const subject = 'Your Prime Buy password reset code';
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

async function sendVerificationEmail({ to, code }) {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL SKIPPED] Verification code for ${to}: ${code}`);
    return { skipped: true };
  }

  const subject = 'Verifica tu email - Prime Buy';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #f97316; margin: 0;">Prime Buy</h1>
      </div>
      <h2 style="color: #333; margin-bottom: 16px;">Verifica tu correo electrónico</h2>
      <p style="color: #555; margin-bottom: 24px;">
        Gracias por registrarte. Usa el siguiente código para verificar tu email:
      </p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <h1 style="letter-spacing: 8px; font-size: 32px; margin: 0; color: #333;">${code}</h1>
      </div>
      <p style="color: #888; font-size: 14px;">
        Este código expira en 15 minutos.
      </p>
      <p style="color: #888; font-size: 14px;">
        Si no solicitaste esta verificación, puedes ignorar este correo.
      </p>
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

/**
 * Send a transactional email (order confirmations, status updates, etc.)
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - Email HTML body
 */
async function sendTransactionalEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL SKIPPED] Transactional email to ${to}: ${subject}`);
    return { skipped: true };
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    html,
  });

  return { skipped: false };
}

module.exports = {
  sendPasswordResetCode,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendTransactionalEmail,
};
