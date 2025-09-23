import { Router } from 'express';
import { EstudianteController } from '../controllers/estudiante.controller.js';
import { verifyToken, verifyEstudiante } from '../middlewares/jwt.middlware.js';

const router = Router();

// api/v1/users

//router.post('/register', UserController.register)

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
router.get('/InitEstudiante', verifyToken, verifyEstudiante, EstudianteController.InitEstudiante);

export default router;
