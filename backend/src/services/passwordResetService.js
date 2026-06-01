const crypto = require('crypto');
const supabase = require('../config/supabase');

const RESET_TOKEN_BYTES = 32;
const RESET_EXPIRY_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES || 60);

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getResetBaseUrl() {
  return (
    process.env.PASSWORD_RESET_BASE_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173'
  ).replace(/\/+$/, '');
}

function shouldReturnResetUrl() {
  return process.env.NODE_ENV !== 'production' || process.env.PASSWORD_RESET_RETURN_LINK === 'true';
}

function buildResetUrl(token) {
  return `${getResetBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

async function createPasswordReset(userId) {
  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error: cleanupError } = await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('used_at', null);
  if (cleanupError) throw cleanupError;

  const { error } = await supabase.from('password_reset_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (error) throw error;

  return {
    token,
    reset_url: buildResetUrl(token),
    expires_at: expiresAt,
  };
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;
  if (!apiKey || !from) {
    return { sent: false, reason: 'email_not_configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Reset your CivicPulse password',
      html: `
        <p>Hello ${name || 'Citizen'},</p>
        <p>Use this secure link to reset your CivicPulse password. It expires in ${RESET_EXPIRY_MINUTES} minutes.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`Password reset email failed: ${text}`);
    error.status = response.status;
    throw error;
  }

  return { sent: true };
}

async function consumePasswordReset(token) {
  const tokenHash = hashResetToken(token);
  const { data: resetRow, error } = await supabase
    .from('password_reset_tokens')
    .select('*, users(*)')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!resetRow || new Date(resetRow.expires_at).getTime() < Date.now()) {
    const invalid = new Error('Reset link is invalid or expired');
    invalid.status = 400;
    throw invalid;
  }

  return resetRow;
}

async function markPasswordResetUsed(resetId) {
  const { error } = await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', resetId);
  if (error) throw error;
}

module.exports = {
  createPasswordReset,
  consumePasswordReset,
  markPasswordResetUsed,
  sendPasswordResetEmail,
  shouldReturnResetUrl,
};
