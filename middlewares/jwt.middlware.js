import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model.js';
import { UtilsTokenAcceso } from '../Utils/creartoken.js';

//verificar que la  cookie  sigue activa
export const verifyToken = async (req, res, next) => {
  console.log(req.signedCookies.auth_token);
  const token = req.signedCookies.auth_token;

  if (!token) {
    const id_refresh = req.signedCookies.Rtoken;
    //console.log("id"+id_refresh)
    if (!id_refresh) {
      res.clearCookie('auth_token');
      res.clearCookie('Rtoken');
      return res.status(401).json({ error: 'Usuario No AUTENTICADO o EXPIRADO' });
    }
    const RTOKEN = await UserModel.verifyRtoken(id_refresh);
    //console.log(RTOKEN)
    if (!RTOKEN) {
      res.clearCookie('auth_token');
      res.clearCookie('Rtoken');

      return res.status(401).json({ error: 'Usuario No AUTENTICADO' });
    }
    try {
      const { email, rol, id_persona } = jwt.verify(RTOKEN.token, process.env.JWT_SECRET);
      const tokennuevo = UtilsTokenAcceso.crearTokenCookie(res, {
        email: email,
        rol: rol,
        id_persona: id_persona,
      });
      req.email = email;
      req.rol = rol;
      req.id_persona = id_persona;
      //console.log("neuvo token de acceso")
      return next();
    } catch (err) {
      res.clearCookie('auth_token');
      res.clearCookie('Rtoken');
      return res.status(401).json({ error: 'Refresh  token Corrupto' });
    }
  }

  try {
    const { email, rol, id_persona } = jwt.verify(token, process.env.JWT_SECRET);
    req.email = email;
    req.rol = rol;
    req.id_persona = id_persona;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const decoded = jwt.decode(token);
      if (!decoded) {
        res.clearCookie('auth_token');
        res.clearCookie('Rtoken');
        return res.status(401).json({ error: 'Token corrupto o mal formado' });
      }
      const { email, rol, id_persona } = decoded;

      const id_refresh = req.signedCookies.Rtoken;

      const Rtoken = await UserModel.verifyRtoken(id_refresh);

      if (!Rtoken) {
        res.clearCookie('auth_token');
        res.clearCookie('Rtoken');
        return res.status(401).json({ error: 'Acceso expirado' });
      }
      try {
        jwt.verify(Rtoken.token, process.env.JWT_SECRET);

        const tokennuevo = UtilsTokenAcceso.crearTokenCookie(res, {
          email: email,
          rol: rol,
          id_persona: id_persona,
        });
        req.email = email;
        req.rol = rol;
        req.id_persona = id_persona;
        //console.log("neuvo token de acceso paso 2")
        return next();
      } catch {
        res.clearCookie('auth_token');
        res.clearCookie('Rtoken');
        return res.status(401).json({ error: 'Refresh Token expirado' });
      }
    } else {
      res.clearCookie('auth_token');
      res.clearCookie('Rtoken');
      //console.log('Refresh token inválido o manipulado');
      return res.status(401).json({ error: 'token inválido' });
    }
  }
};

export const verifyAdmin = (req, res, next) => {
  if (req.rol === 'administrador') {
    return next();
  }
  return res.status(403).json({ error: 'Unauthorized only admin user' });
};
export const verifyTutor = (req, res, next) => {
  if (req.rol === 'tutor') {
    return next();
  }
  return res.status(403).json({ error: 'Unauthorized only tutor user' });
};
export const verifyAdminTutor = (req, res, next) => {
  if (req.rol === 'tutor' || req.rol === 'administrador') {
    return next();
  }
  return res.status(403).json({ error: 'No autorizado' });
};
export const verifyEstudiante = (req, res, next) => {
  if (req.rol === 'estudiante') {
    return next();
  }
  return res.status(403).json({ error: 'No autorizado' });
};
