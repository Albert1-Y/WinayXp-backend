import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model.js';
import ms from 'ms';

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    //console.log(req.body);
    console.log('estamos comparando contraseñas');
    const user = await UserModel.findOneByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    //crear el refresh token
    const refreshtoken = jwt.sign(
      { email: user.email, rol: user.rol, id_persona: user.id_persona },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.REFRESH_JWT_EXPIRES_IN,
      }
    );
    //guaRdar el refresh en BD

    const id_Rtoken = await UserModel.saverRefreshToken(user.id_persona, refreshtoken);

    // cookie gurda la id de resfresh token
    const RmaxAge = ms(process.env.COOKIE_RefreshMAXAGE);
    res.cookie('Rtoken', id_Rtoken, {
      httpOnly: true,
      signed: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      maxAge: RmaxAge,
    });

    //crear acces token
    const token = jwt.sign(
      { email: user.email, rol: user.rol, id_persona: user.id_persona },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );
    const maxAge = ms(process.env.COOKIE_MAXAGE);

    res.cookie('auth_token', token, {
      httpOnly: true,
      signed: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      maxAge: maxAge,
    });
    return res.status(200).json({
      ok: true,
      rol: user.rol,
      msg: 'inicion de sesion exitoso',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};

const ranking = async (req, res) => {
  try {
    const topR = await UserModel.rankingtop();
    return res.status(200).json(topR);
  } catch {
    return res.status(500).json({
      msg: 'Error server',
    });
  }
};
const logout = async (req, res) => {
  try {
    const id_refresh = req.signedCookies.Rtoken;
    console.log(id_refresh);
    if (id_refresh) {
      await UserModel.eliminarRtoken(id_refresh);
    }

    res.clearCookie('auth_token');
    res.clearCookie('Rtoken');
    console.log('sali');
    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

export const UserController = {
  login,
  ranking,
  logout,
};
