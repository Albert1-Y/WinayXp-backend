const { Router } = require("express");
const { EstudianteController } = require("../controllers/estudiante.controller.js");
const { verifyToken, verifyEstudiante } = require("../middlewares/jwt.middlware.js");

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
router.get(
  "/InitEstudiante",
  verifyToken,
  verifyEstudiante,
  EstudianteController.InitEstudiante,
);
router.get(
  "/TopEstudiantesCarrera",
  EstudianteController.TopEstudiantesCarrera,
);
/**
 * @swagger
 * /api/estudiante/getActividadesAsistidas:
 *   get:
 *     summary: Obtener lista de actividades asistidas por el estudiante autenticado
 *     tags: [Estudiante]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de actividades asistidas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_actividad:
 *                     type: integer
 *                   nombre_actividad:
 *                     type: string
 *                   fecha_inicio:
 *                     type: string
 *                     format: date-time
 *                   fecha_fin:
 *                     type: string
 *                     format: date-time
 *                   lugar:
 *                     type: string
 *                   creditos:
 *                     type: integer
 *                   semestre:
 *                     type: string
 *                   fecha_asistencia:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get(
  "/getActividadesAsistidas",
  verifyToken,
  verifyEstudiante,
  EstudianteController.getActividadesAsistidas,
);

/**
 * @swagger
 * /api/estudiante/confirmarNivel:
 *   put:
 *     summary: Marca los niveles alcanzados como vistos por el estudiante autenticado
 *     tags: [Estudiante]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_nivel:
 *                 type: integer
 *                 description: Último nivel cuya animación ya visualizó el estudiante.
 *             required:
 *               - id_nivel
 *     responses:
 *       200:
 *         description: Confirmación registrada correctamente
 *       400:
 *         description: Parámetros inválidos
 */
router.put(
  "/confirmarNivel",
  verifyToken,
  verifyEstudiante,
  EstudianteController.confirmarNivelesVistos,
);

module.exports = router;
