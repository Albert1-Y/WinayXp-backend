import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client();

export async function verifyGoogleIdToken(idToken, aud) {
  const ticket = await client.verifyIdToken({ idToken, audience: aud });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google ID token');
  return payload;
}

export function buildAuthUrl(params = {}) {
  const base = 'https://accounts.google.com/o/oauth2/v2/auth';
  const defaults = {
    response_type: 'code',
    scope: 'openid email profile',
    include_granted_scopes: 'false', // no “combina” permisos previos
    prompt: 'select_account',        // 👈 fuerza el selector de cuentas
    access_type: 'online',           // (opcional) usa 'offline' si necesitas refresh_token
  };
  const qs = new URLSearchParams({ ...defaults, ...params });
  return `${base}?${qs.toString()}`;
}
