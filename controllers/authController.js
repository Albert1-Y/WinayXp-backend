import * as crypto from 'crypto';
import axios from 'axios';
import jwt from 'jsonwebtoken';

import { db } from '../database/connection.database.js';
import { savePkceState, getPkceState, deletePkceState } from '../Utils/pkceStore.js';
import { verifyGoogleIdToken, buildAuthUrl } from '../Utils/google.js';

/* -------- helpers de negocio -------- */

async function isDomainAllowed(domain) {
  // 1) Si estamos en modo pruebas y es gmail.com → permitir
  const allowGmail = process.env.ALLOW_GMAIL === 'true';
  if (allowGmail && domain === 'gmail.com') return true;

  // 2) Dominios permitidos por ENV
  const envList = (process.env.ALLOWED_DOMAINS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (envList.includes(domain)) return true;

  // 3) Dominios permitidos por BD
  const { rows } = await db.query(
    `SELECT 1 FROM institucion WHERE dominio_email=$1 AND esta_activa=TRUE LIMIT 1`,
    [domain]
  );
  return rows.length > 0;
}


async function isWhitelistedEmail(email) {
  const { rows } = await db.query(
    `SELECT 1 FROM persona_institucion WHERE email_institucional=$1 AND estado='activo' LIMIT 1`,
    [email]
  );
  return rows.length > 0;
}

async function findPersonaIdByEmail(email) {
  const { rows } = await db.query(`SELECT id_persona FROM persona WHERE email=$1 LIMIT 1`, [email]);
  return rows[0]?.id_persona || null;
}

function splitName(full) {
  if (!full) return { nombre: 'Usuario', apellido: 'Google' };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { nombre: parts[0], apellido: 'Google' };
  const apellido = parts.pop();
  return { nombre: parts.join(' '), apellido };
}

async function ensurePersonaForEmail(email, fullName) {
  const existing = await findPersonaIdByEmail(email);
  if (existing) return existing;

  const { rows: ok } = await db.query(
    `SELECT EXISTS(SELECT 1 FROM persona_institucion WHERE email_institucional=$1 AND estado='activo') AS ok`,
    [email]
  );
  if (!ok[0]?.ok) throw new Error('Email no presente en directorio');

  const { nombre, apellido } = splitName(fullName);
  const dni = process.env.DEFAULT_DNI || '00000000';
  const rol = process.env.DEFAULT_ROL || 'estudiante';

  const ins = await db.query(
    `INSERT INTO persona (dni, nombre_persona, apellido, email, rol, activo)
     VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING id_persona`,
    [dni, nombre, apellido, email, rol]
  );
  return ins.rows[0].id_persona;
}

async function upsertUsuarioGoogle(idPersona, { sub, email, email_verified, hd }) {
  await db.query(
    `INSERT INTO usuario_google (id_persona, sub, email_google, email_verificado, hd, ultimo_login_google)
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT (sub) DO UPDATE SET
       id_persona=EXCLUDED.id_persona,
       email_google=EXCLUDED.email_google,
       email_verificado=EXCLUDED.email_verificado,
       hd=EXCLUDED.hd,
       ultimo_login_google=EXCLUDED.ultimo_login_google`,
    [idPersona, sub, email, email_verified, hd || null]
  );
}

async function auditLogin(idPersona, ok, req, reason) {
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim())
    || (req.socket.remoteAddress || null);
  const ua = req.headers['user-agent'] || null;

  await db.query(
    `INSERT INTO login_auditoria (id_persona, proveedor, exitoso, ip, user_agent, motivo_fallo)
     VALUES ($1,'google',$2,$3,$4,$5)`,
    [idPersona, ok, ip, ua, reason || null]
  );
}

/* -------- controladores (exports nombrados) -------- */

export async function googleStart(req, res) {
  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256')
    .update(codeVerifier).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await savePkceState(state, codeVerifier, process.env.OAUTH_REDIRECT_URI);

  // lee el hint de dominio que viene desde el frontend (si lo envías con ?hd=)
  const hd = (req.query.hd || '').trim();

  const url = buildAuthUrl({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    prompt: 'select_account',
    include_granted_scopes: 'false',
    ...(hd ? { hd } : {}), // solo añade hd si existe
  });

  res.redirect(url);
}

function redirectOk(res, front, path = '/dashboard') {
  return res.redirect(`${front}${path}`);
}
function redirectErr(res, code) {
  const front = process.env.APP_ORIGIN || "http://localhost:5173";
  return res.redirect(`${front}/login?error=${encodeURIComponent(code)}`);
}

export async function googleCallback(req, res) {
  const front = process.env.APP_ORIGIN || '/';

  const { code, state } = req.query;
  if (!code || !state) return redirectErr(res, 'missing_params');

  // 1) Validar y consumir PKCE state
  const saved = await getPkceState(state).catch((e) => {
    console.error('[oauth] getPkceState error:', e);
    return null;
  });
  if (!saved) return redirectErr(res, 'invalid_state');

  try {
    // 2) Intercambiar code por tokens
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        code_verifier: saved.code_verifier,
        redirect_uri: process.env.OAUTH_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Consumir el state pase lo que pase
    await deletePkceState(state).catch((e) =>
      console.warn('[oauth] deletePkceState warn:', e)
    );

    const { id_token } = tokenRes.data || {};
    if (!id_token) return redirectErr(res, 'exchange_failed');

    // 3) Verificar ID Token
    let claims;
    try {
      claims = await verifyGoogleIdToken(id_token, process.env.GOOGLE_CLIENT_ID);
    } catch (e) {
      console.error('[oauth] invalid id_token:', e?.response?.data || e?.message || e);
      return redirectErr(res, 'invalid_id_token');
    }

    const email = claims.email;
    const email_verified = !!claims.email_verified;
    const sub = claims.sub;
    const hd = claims.hd || null;

    if (!email || !email_verified) {
      await auditLogin(null, false, req, 'email_no_verificado');
      return redirectErr(res, 'email_not_verified');
    }

    // 4) Reglas de acceso institucional
    const domain = email.split('@')[1]?.toLowerCase() || '';
    const domainOk = await isDomainAllowed(domain).catch((e) => {
      console.error('[oauth] isDomainAllowed error:', e);
      return false;
    });
    const wlOk = await isWhitelistedEmail(email).catch((e) => {
      console.error('[oauth] isWhitelistedEmail error:', e);
      return false;
    });

    if (!(domainOk || wlOk)) {
      await auditLogin(null, false, req, 'no_institucional');
      return redirectErr(res, 'not_whitelisted');
    }

    // 5) Asegurar persona
    let idPersona = await findPersonaIdByEmail(email).catch(() => null);
    if (!idPersona) {
      try {
        idPersona = await ensurePersonaForEmail(email, claims.name);
      } catch (e) {
        console.error('[oauth] ensurePersonaForEmail error:', e);
        await auditLogin(null, false, req, 'no_persona');
        return redirectErr(res, 'no_persona');
      }
    }

    // 6) Vincular google + auditoría
    try {
      await upsertUsuarioGoogle(idPersona, { sub, email, email_verified, hd });
      await auditLogin(idPersona, true, req, null);
    } catch (e) {
      console.error('[oauth] upsert/audit error:', e);
      return redirectErr(res, 'db_error');
    }

    // 7) Crear cookie de sesión
    const token = jwt.sign(
      { uid: idPersona, rol: 'estudiante' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('app_session', token, {
      httpOnly: true,
      sameSite: 'none',   // 👈 importante
      secure: true,       // 👈 requerido por Chrome para SameSite=None (vale en localhost)
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return redirectOk(res, front, '/dashboard');
  } catch (e) {
    console.error('[oauth] callback error:', e);
    return redirectErr(res, 'callback_error');
  }
}

export async function me(req, res) {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'No autenticado' });

  const { rows } = await db.query(
    `SELECT id_persona, email, rol, activo FROM persona WHERE id_persona=$1`,
    [uid]
  );
  if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
}

export async function logout(req, res) {
  res.clearCookie('app_session', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ ok: true });
}
