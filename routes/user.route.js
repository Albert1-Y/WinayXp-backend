import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { verifyAdmin, verifyToken } from "../middlewares/jwt.middlware.js";
import { validarLogin } from "../middlewares/validator_entrada.middlware.js";

const router = Router();

/**
 * @openapi
 * /cedhi/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica al usuario y retorna cookies de sesión (auth_token, Rtoken).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@cedhi.edu
 *               password:
 *                 type: string
 *                 example: TuPassword123
 *     responses:
 *       200:
 *         description: Login exitoso (cookies seteadas)
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', validarLogin, UserController.login);

/**
 * @openapi
 * /cedhi/login:
 *   get:
 *     summary: Ranking público / endpoint público de ejemplo
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/login', UserController.ranking);

/**
 * @openapi
 * /cedhi/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada
 */
router.post('/logout', UserController.logout);

export default router;
