import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
//import { verifyAdmin, verifyToken } from "../middlewares/jwt.middlware.js";
import { validarLogin } from '../middlewares/validator_entrada.middlware.js';
import passport from '../middlewares/passport.js';
import { UserModel } from '../models/user.model.js';
import ms from 'ms';
import jwt from 'jsonwebtoken';

const router = Router();

// api/v1/users

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticación y sesión de usuarios
 *   - name: Usuario
 *     description: Operaciones generales de usuario
 */

//router.post('/register', UserController.register)
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Iniciar sesión con email y password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: usuario@email.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 rol:
 *                   type: string
 *                 msg:
 *                   type: string
 *       400:
 *         description: Validación fallida
 *       401:
 *         description: Credenciales inválidas
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/login', validarLogin, UserController.login);

/**
 * @swagger
 * /api/login:
 *   get:
 *     summary: Obtener ranking de usuarios
 *     tags: [Usuario]
 *     responses:
 *       200:
 *         description: Lista de usuarios ordenados por ranking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/login', UserController.ranking);

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Cerrar sesión del usuario
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *       401:
 *         description: Usuario no autenticado
 */
router.post('/logout', UserController.logout);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Inicia el flujo de autenticación con Google OAuth 2.0
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirección a Google para autenticación
 */
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback de Google OAuth 2.0
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Código de autorización de Google
 *     responses:
 *       302:
 *         description: Redirección al frontend con cookie de sesión
 *       401:
 *         description: Fallo de autenticación
 */
router.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', async (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      const msg = encodeURIComponent(
        info?.message || 'Acceso denegado. Contacta al administrador.'
      );
      return res.redirect(`${process.env.URL_FRONT}/auth/result?status=error&msg=${msg}`);
    }

    const email = user.email;
    let foundUser = await UserModel.findOneByEmail(email);
    if (!foundUser) {
      foundUser = await UserModel.createPersona({
        nombre_persona: user.nombre_persona || user.displayName,
        email,
        rol: 'estudiante',
      });
    }

    // Crear y guardar refresh token como en login normal
    const refreshtoken = jwt.sign(
      { email: foundUser.email, rol: foundUser.rol, id_persona: foundUser.id_persona },
      process.env.JWT_SECRET,
      { expiresIn: process.env.REFRESH_JWT_EXPIRES_IN }
    );
    const id_Rtoken = await UserModel.saverRefreshToken(foundUser.id_persona, refreshtoken);

    res.cookie('Rtoken', id_Rtoken, {
      httpOnly: true,
      signed: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      maxAge: ms(process.env.COOKIE_RefreshMAXAGE),
    });

    // Crear access token y setear cookie
    const token = jwt.sign(
      { email: foundUser.email, rol: foundUser.rol, id_persona: foundUser.id_persona },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      signed: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      maxAge: ms(process.env.COOKIE_MAXAGE),
    });

    //res.redirect(`${process.env.URL_FRONT}/auth/result?status=success`);
    // Si el frontend usa HashRouter, apunta a /#/auth-result (según App.jsx)
    res.redirect(`${process.env.URL_FRONT}/#/auth-result?status=success&rol=${foundUser.rol}`);
  })(req, res, next);
});

/**
 * @swagger
 * /api/user/completar-datos:
 *   post:
 *     summary: Completar datos faltantes del usuario
 *     tags: [Usuario]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dni:
 *                 type: string
 *                 example: "12345678"
 *               nombre_persona:
 *                 type: string
 *                 example: "Juan Perez"
 *               apellido:
 *                 type: string
 *                 example: "Perez"
 *     responses:
 *       200:
 *         description: Datos actualizados correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/user/completar-datos', async (req, res) => {
  const { email, dni, nombre_persona, apellido } = req.body;

  if (!email || !dni || !nombre_persona || !apellido) {
    return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
  }

  try {
    const existingUser = await UserModel.findOneByEmail(email);

    if (!existingUser) {
      const newUser = await UserModel.createPersona({
        email,
        nombre_persona,
        apellido,
        dni,
        rol: 'estudiante',
        activo: false,
      });

      return res.status(201).json({
        msg: 'Usuario registrado correctamente. Pendiente de activacion.',
        id_persona: newUser.id_persona,
      });
    }

    await UserModel.updatePersonaDatos({
      id_persona: existingUser.id_persona,
      dni,
      nombre_persona,
      apellido,
    });

    return res.json({ msg: 'Datos actualizados correctamente.' });
  } catch (error) {
    console.error('Error al completar datos:', error);
    return res.status(500).json({ msg: 'Error al procesar los datos.' });
  }
});

export default router;
