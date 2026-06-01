const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client();

function configuredClientIds() {
  return [
    process.env.GOOGLE_CLIENT_IDS,
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

async function verifyGoogleIdToken(idToken) {
  const clientIds = configuredClientIds();
  if (!clientIds.length) {
    const error = new Error('Google sign-in is not configured yet');
    error.status = 503;
    throw error;
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientIds.length === 1 ? clientIds[0] : clientIds,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload?.email) {
    const error = new Error('Google account response was incomplete');
    error.status = 401;
    throw error;
  }

  if (payload.email_verified === false) {
    const error = new Error('Google email is not verified');
    error.status = 401;
    throw error;
  }

  return {
    uid: payload.sub,
    email: String(payload.email).toLowerCase(),
    name: payload.name || payload.email,
    avatar_url: payload.picture || null,
    email_verified: payload.email_verified !== false,
  };
}

module.exports = {
  verifyGoogleIdToken,
};
