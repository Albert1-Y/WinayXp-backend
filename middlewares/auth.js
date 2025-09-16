// middlewares/auth.js  (ESM)
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'app_session'; // ajústalo si usas otro nombre

export const requireAuth = (req, res, next) => {
  try {
    // intenta desde cookie firmada o normal
    const token =
      (req.signedCookies && req.signedCookies[COOKIE_NAME]) ||
      (req.cookies && req.cookies[COOKIE_NAME]) ||
      // fallback: Authorization: Bearer <token>
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) return res.status(401).json({ ok: false, message: 'No autenticado' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // deja al usuario en la request
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token inválido o expirado' });
  }
};
