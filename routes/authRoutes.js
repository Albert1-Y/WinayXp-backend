/**
 * Rutas de autenticación con Google OAuth 2.0
 * ============================================
 * Este archivo define las rutas principales para el flujo de login con Google.
 */

import { Router } from 'express';
import { googleStart, googleCallback, me, logout } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

/**
 * @openapi
 * /auth/google/start:
 *   get:
 *     tags: [Auth]
 *     summary: Inicia el flujo OAuth 2.0 con Google
 *     description: Genera `state` y `code_challenge` (PKCE), guarda en DB y redirige al endpoint de autorización de Google.
 *     responses:
 *       302:
 *         description: Redirección a Google
 */
router.get('/auth/google/start', googleStart);

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback que Google invoca tras el login
 *     description: Valida el ID Token, comprueba dominio/whitelist institucional, registra auditoría y crea cookie de sesión httpOnly.
 *     responses:
 *       200:
 *         description: Sesión creada
 *       400:
 *         description: Error en validación del token
 */
router.get('/auth/google/callback', googleCallback);

/**
 * @openapi
 * /me:
 *   get:
 *     tags: [Auth]
 *     summary: Devuelve los datos mínimos del usuario autenticado
 *     description: Requiere sesión activa (JWT en cookie).
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBasic'
 *       401:
 *         description: No autenticado
 */
router.get('/me', requireAuth, me);

/**
 * @openapi
 * /logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cierra la sesión
 *     description: Limpia la cookie de sesión y finaliza la sesión del usuario.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Sesión cerrada exitosamente
 */
router.post('/logout', logout);

export default router;
