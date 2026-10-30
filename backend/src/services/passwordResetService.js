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
  return process.env.NODE_ENV !== 'production' && process.env.PASSWORD_RESET_RETURN_LINK === 'true';
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

  const escape = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Reset your CivicsPulse password',
      html: `
        <p>Hello ${escape(name || 'Citizen')},</p>
        <p>Use this secure link to reset your CivicsPulse password. It expires in ${RESET_EXPIRY_MINUTES} minutes.</p>
        <p><a href="${escape(resetUrl)}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    const error = new Error('Password reset email is temporarily unavailable');
    error.status = 503;
    throw error;
  }

  return { sent: true };
}

async function completePasswordReset(token, passwordHash) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    const invalid = new Error('Reset link is invalid or expired');
    invalid.status = 400;
    throw invalid;
  }
  const { data, error } = await supabase.rpc('complete_password_reset', {
    p_token_hash: hashResetToken(token), p_password_hash: passwordHash,
  });
  if (error) throw Object.assign(new Error('Reset link is invalid or expired'), { status: 400 });
  return data;
}

module.exports = {
  createPasswordReset,
  completePasswordReset,
  sendPasswordResetEmail,
  shouldReturnResetUrl,
};
