import { Router } from "express";
import { EstudianteController } from "../controllers/estudiante.controller.js";
import { verifyToken, verifyEstudiante } from "../middlewares/jwt.middlware.js";

const router = Router();

/**
 * @openapi
 * /cedhi/estudiante/InitEstudiante:
 *   get:
 *     summary: Inicializar panel del estudiante
 *     tags: [Estudiante]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/InitEstudiante', verifyToken, verifyEstudiante, EstudianteController.InitEstudiante);

export default router;
