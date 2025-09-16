import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client();

export async function verifyGoogleIdToken(idToken, aud) {
  const ticket = await client.verifyIdToken({ idToken, audience: aud });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google ID token');
  return payload;
}

export function buildAuthUrl(params) {
  const qs = new URLSearchParams(params);
  return `https://accounts.google.com/o/oauth2/v2/auth?${qs.toString()}`;
}
