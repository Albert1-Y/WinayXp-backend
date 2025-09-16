import { Router } from "express";
import { AdminController, AdminSharedController } from "../controllers/admin.controller.js";
import { AdminActividadController } from "../controllers/admin.controller.actividad.js";
import { verifyAdmin, verifyAdminTutor, verifyToken } from "../middlewares/jwt.middlware.js";

const router = Router();

/**
 * @openapi
 * /cedhi/admin/init:
 *   get:
 *     summary: Inicializar panel (Admin/Tutor)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/init', verifyToken, verifyAdminTutor, AdminSharedController.initAdminTutor);

/**
 * @openapi
 * /cedhi/admin/registerAT:
 *   post:
 *     summary: Registrar administrador o tutor
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               rol:
 *                 type: string
 *                 enum: [administrador, tutor]
 *     responses:
 *       201:
 *         description: Creado
 */
router.post('/registerAT', verifyToken, verifyAdmin, AdminController.register_Admin_tutor);

/**
 * @openapi
 * /cedhi/admin/registerE:
 *   post:
 *     summary: Registrar estudiante
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dni: { type: string }
 *               email: { type: string }
 *               nombre: { type: string }
 *               apellido: { type: string }
 *     responses:
 *       201:
 *         description: Estudiante creado
 */
router.post('/registerE', verifyToken, verifyAdminTutor, AdminSharedController.registeEstudiante);

/**
 * @openapi
 * /cedhi/admin/registerME:
 *   post:
 *     summary: Registrar múltiples estudiantes
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Estudiantes creados
 */
router.post('/registerME', AdminSharedController.registerMultipleEstudiantes);

/**
 * @openapi
 * /cedhi/admin/crearActividad:
 *   post:
 *     summary: Crear actividad
 *     tags: [Admin-Actividad]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_actividad: { type: string }
 *               fecha_inicio: { type: string, format: date-time }
 *               fecha_fin: { type: string, format: date-time }
 *               lugar: { type: string }
 *               creditos: { type: integer }
 *               id_semestre: { type: integer }
 *     responses:
 *       201:
 *         description: Actividad creada
 */
router.post('/crearActividad', verifyToken, verifyAdminTutor, AdminActividadController.crearActividad);

/**
 * @openapi
 * /cedhi/admin/DatosEstudiante:
 *   get:
 *     summary: Obtener datos de estudiante (admin/tutor)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id_estudiante
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/DatosEstudiante', verifyToken, verifyAdminTutor, AdminSharedController.DatosEstudiante);

/**
 * @openapi
 * /cedhi/admin/EliminarEstudiante:
 *   delete:
 *     summary: Eliminar estudiante
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id_estudiante
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Eliminado
 */
router.delete('/EliminarEstudiante', verifyToken, verifyAdminTutor, AdminSharedController.DeleteEstudiante);

/**
 * @openapi
 * /cedhi/admin/EliminarActividad:
 *   delete:
 *     summary: Eliminar actividad
 *     tags: [Admin-Actividad]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id_actividad
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Eliminada
 */
router.delete('/EliminarActividad', verifyToken, verifyAdminTutor, AdminActividadController.DeleteActividad);

/**
 * @openapi
 * /cedhi/admin/MostrarActividad:
 *   get:
 *     summary: Listar actividades
 *     tags: [Admin-Actividad]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/MostrarActividad', verifyToken, verifyAdminTutor, AdminActividadController.MostrarActividad);

/**
 * @openapi
 * /cedhi/admin/verifyAT:
 *   get:
 *     summary: Verificar Admin/Tutor
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Válido
 *       403:
 *         description: No autorizado
 */
router.get('/verifyAT', verifyToken, verifyAdminTutor, AdminSharedController.verifyGET);

/**
 * @openapi
 * /cedhi/admin/verifyA:
 *   get:
 *     summary: Verificar Admin
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Válido
 *       403:
 *         description: No autorizado
 */
router.get('/verifyA', verifyToken, verifyAdmin, AdminSharedController.verifyGET);

/**
 * @openapi
 * /cedhi/admin/IntMostrarEstudiantes:
 *   get:
 *     summary: Inicializar listado de estudiantes
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/IntMostrarEstudiantes', verifyToken, verifyAdminTutor, AdminSharedController.initMostrarEstudaintes);

/**
 * @openapi
 * /cedhi/admin/MostrarTutores:
 *   get:
 *     summary: Listar tutores
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/MostrarTutores', verifyToken, verifyAdmin, AdminController.MostrarTutor);

/**
 * @openapi
 * /cedhi/admin/DeleteTutores:
 *   delete:
 *     summary: Eliminar tutor
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id_persona
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Eliminado
 */
router.delete('/DeleteTutores', verifyToken, verifyAdmin, AdminController.DeleteTutor);

export default router;
