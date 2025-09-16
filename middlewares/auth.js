import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies['app_session'];
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { uid, rol }
    next();
  } catch (e) {
    console.error('[auth] invalid token:', e.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
}