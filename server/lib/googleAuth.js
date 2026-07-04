const { OAuth2Client } = require('google-auth-library');

// Set this to your Google Cloud OAuth "Web application" client ID once you've created one
// (see README > Google OAuth setup). Until then, /auth/google responds with a clear
// "not configured" error instead of a confusing crash.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

async function verifyGoogleIdToken(idToken) {
  if (!client) {
    const err = new Error(
      'Google Sign-In is not configured on this server yet. Set GOOGLE_CLIENT_ID in server/.env (see README).'
    );
    err.code = 'GOOGLE_NOT_CONFIGURED';
    throw err;
  }
  const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    const err = new Error('Google did not return an email address for this account.');
    err.code = 'GOOGLE_NO_EMAIL';
    throw err;
  }
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email,
    emailVerified: !!payload.email_verified,
  };
}

module.exports = { verifyGoogleIdToken, isGoogleConfigured: () => !!client };
