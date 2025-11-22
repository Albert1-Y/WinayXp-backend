const { Router } = require('express');
const { AdminController, AdminSharedController } = require('../controllers/admin.controller.js');
const { AdminActividadController } = require('../controllers/admin.controller.actividad.js');
const { verifyAdmin, verifyAdminTutor, verifyToken } = require('../middlewares/jwt.middlware.js');
const { upload } = require('../middlewares/upload.middleware.js');

const router = Router();

// api/v1/users
/**
 * @swagger
 * /api/admin/init:
 *   get:
 *     summary: Inicializar datos para admin/tutor
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol tutor o administrador.
 *     responses:
 *       200:
 *         description: Datos iniciales
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get('/init', verifyToken, verifyAdminTutor, AdminSharedController.initAdminTutor);

//REGISTRO DE ADMIN Y TUTOR
/**
 * @swagger
 * /api/admin/registerAT:
 *   post:
 *     summary: Registrar un nuevo administrador o tutor
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol administrador.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               nombre_persona:
 *                 type: string
 *               apellido:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [administrador, tutor]
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       403:
 *         description: No autorizado
 */
router.post('/registerAT', verifyToken, verifyAdmin, AdminController.register_Admin_tutor);

//REGISTER ESTUDIANTE
/**
 * @swagger
 * /api/admin/registerE:
 *   post:
 *     summary: Registrar un nuevo estudiante
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol tutor o administrador.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               nombre_persona:
 *                 type: string
 *               apellido:
 *                 type: string
 *               carrera:
 *                 type: string
 *               semestre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Estudiante creado correctamente
 *       403:
 *         description: No autorizado
 */
router.post('/registerE', verifyToken, verifyAdminTutor, AdminSharedController.registeEstudiante);

router.put(
  '/ActulizarEstudiante',
  verifyToken,
  verifyAdmin,
  AdminSharedController.actualizarEstudiante
);

/**
 * @swagger
 * /api/admin/registerME:
 *   post:
 *     summary: Registrar múltiples estudiantes
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string
 *                 nombre_persona:
 *                   type: string
 *                 apellido:
 *                   type: string
 *                 carrera:
 *                   type: string
 *                 semestre:
 *                   type: string
 *     responses:
 *       201:
 *         description: Estudiantes creados correctamente
 *       403:
 *         description: No autorizado
 */
router.post('/registerME', AdminSharedController.registerMultipleEstudiantes);

//crear actividad admin-funcion compartida con tutor
/**
 * @swagger
 * /api/admin/crearActividad:
 *   post:
 *     summary: Crear una nueva actividad
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol tutor o administrador.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_actividad:
 *                 type: string
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *               lugar:
 *                 type: string
 *               creditos:
 *                 type: integer
 *               semestre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Actividad creada correctamente
 *       403:
 *         description: No autorizado
 */
router.post(
  '/crearActividad',
  verifyToken,
  verifyAdminTutor,
  AdminActividadController.crearActividad
);

/**
 * @swagger
 * /api/admin/DatosEstudiante:
 *   get:
 *     summary: Obtener datos de un estudiante
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol tutor o administrador.
 *     parameters:
 *       - in: query
 *         name: dni
 *         schema:
 *           type: string
 *         required: true
 *         description: DNI del estudiante a consultar
 *       - in: query
 *         name: id_persona
 *         schema:
 *           type: integer
 *         required: false
 *         description: Alternativa para buscar por identificador interno del estudiante
 *     responses:
 *       200:
 *         description: Datos del estudiante
 *       403:
 *         description: No autorizado
 */
router.get(
  '/DatosEstudiante',
  verifyToken,
  verifyAdminTutor,
  AdminSharedController.DatosEstudiante
);

/**
 * @swagger
 * /api/admin/EliminarEstudiante:
 *   delete:
 *     summary: Eliminar (lógicamente) un estudiante
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol tutor o administrador.
 *     parameters:
 *       - in: query
 *         name: id_persona
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del estudiante
 *     responses:
 *       200:
 *         description: Estudiante eliminado correctamente
 *       403:
 *         description: No autorizado
 */
router.delete(
  '/EliminarEstudiante',
  verifyToken,
  verifyAdminTutor,
  AdminSharedController.DeleteEstudiante
);

/**
 * @swagger
 * /api/admin/CobrarPuntos:
 *   put:
 *     summary: Cobrar puntos a un estudiante
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para administradores o tutores autenticados.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_persona
 *               - puntos
 *               - motivo
 *             properties:
 *               id_persona:
 *                 type: integer
 *                 description: ID de la persona (estudiante) a quien se le cobrará.
 *               puntos:
 *                 type: integer
 *                 minimum: 1
 *                 description: Cantidad de puntos a descontar.
 *               motivo:
 *                 type: string
 *                 minLength: 5
 *                 description: Justificación visible en el historial de movimientos.
 *     responses:
 *       200:
 *         description: Puntos descontados correctamente.
 *       400:
 *         description: Datos inválidos o saldo insuficiente.
 *       403:
 *         description: No autorizado (solo tutores/administradores).
 *       404:
 *         description: Estudiante no encontrado.
 */
router.put('/CobrarPuntos', verifyToken, verifyAdminTutor, AdminSharedController.cobrarPuntos);

/**
 * @swagger
 * /api/admin/BonificarPuntos:
 *   post:
 *     summary: Otorgar puntos por acciones destacadas
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Incrementa los créditos de un estudiante y registra el motivo en el historial (solo tutores/administradores).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_persona
 *               - puntos
 *               - motivo
 *             properties:
 *               id_persona:
 *                 type: integer
 *               puntos:
 *                 type: integer
 *                 minimum: 1
 *               motivo:
 *                 type: string
 *                 minLength: 5
 *               id_actividad:
 *                 type: integer
 *                 description: Opcional; actividad donde ocurrió la acción destacada.
 *     responses:
 *       200:
 *         description: Puntos bonificados correctamente.
 *       400:
 *         description: Datos inválidos.
 *       403:
 *         description: No autorizado.
 *       404:
 *         description: Estudiante o actividad no encontrada.
 */
router.post(
  '/BonificarPuntos',
  verifyToken,
  verifyAdminTutor,
  AdminSharedController.bonificarPuntos
);

/**
 * @swagger
 * /api/admin/HistorialMovimientos:
 *   get:
 *     summary: Listar historial de movimientos de créditos
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Retorna movimientos filtrables por estudiante, tipo y rango de fechas.
 *     parameters:
 *       - in: query
 *         name: id_estudiante
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID del estudiante para filtrar el historial.
 *       - in: query
 *         name: tipo_movimiento
 *         schema:
 *           type: string
 *           enum: [asistencia, bonus, cobro, ajuste]
 *         required: false
 *         description: Tipo específico de movimiento.
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Fecha inicial (ISO 8601) del filtro.
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Fecha final (ISO 8601) del filtro.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         required: false
 *         description: Máximo de registros por página (tope 200).
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         required: false
 *         description: Desplazamiento para paginación.
 *     responses:
 *       200:
 *         description: Historial recuperado correctamente.
 *       403:
 *         description: No autorizado.
 */
router.get(
  '/HistorialMovimientos',
  verifyToken,
  verifyAdminTutor,
  AdminSharedController.listarHistorialMovimientos
);

/**
 * @swagger
 * /api/admin/EliminarActividad:
 *   delete:
 *     summary: Eliminar una actividad
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol tutor o administrador.
 *     parameters:
 *       - in: query
 *         name: id_actividad
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la actividad
 *     responses:
 *       200:
 *         description: Actividad eliminada correctamente
 *       403:
 *         description: No autorizado
 */
router.delete(
  '/EliminarActividad',
  verifyToken,
  verifyAdminTutor,
  AdminActividadController.DeleteActividad
);

/**
 * @swagger
 * /api/admin/MostrarActividad:
 *   get:
 *     summary: Mostrar actividades
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol tutor o administrador.
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *     responses:
 *       200:
 *         description: Lista de actividades
 *       403:
 *         description: No autorizado
 */
router.get(
  '/MostrarActividad',
  verifyToken,
  verifyAdminTutor,
  AdminActividadController.MostrarActividad
);

/**
 * @swagger
 * /api/admin/ActualizarActividad:
 *   put:
 *     summary: Actualizar datos de una actividad existente
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
 *               id_actividad:
 *                 type: integer
 *               nombre_actividad:
 *                 type: string
 *               lugar:
 *                 type: string
 *               creditos:
 *                 type: number
 *               semestre:
 *                 type: string
 *               fecha_inicio:
 *                 type: string
 *                 format: date-time
 *               fecha_fin:
 *                 type: string
 *                 format: date-time
 *             required:
 *               - id_actividad
 *     responses:
 *       200:
 *         description: Actividad actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Actividad no encontrada
 */
router.put(
  '/ActualizarActividad',
  verifyToken,
  verifyAdminTutor,
  AdminActividadController.actualizarActividad
);

/**
 * @swagger
 * /api/admin/ActividadesPorSemestre:
 *   get:
 *     summary: Listar actividades filtradas por semestre
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Devuelve las actividades activas del semestre indicado o todas si no se envía parámetro.
 *     parameters:
 *       - in: query
 *         name: id_semestre
 *         schema:
 *           type: integer
 *         required: false
 *         description: Identificador del semestre. Si se omite se retornan todas las actividades activas.
 *     responses:
 *       200:
 *         description: Lista de actividades
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
 *                   id_semestre:
 *                     type: integer
 *                   semestre:
 *                     type: string
 *                   asistencia_total:
 *                     type: integer
 *       403:
 *         description: No autorizado
 */
router.get(
  '/ActividadesPorSemestre',
  verifyToken,
  verifyAdminTutor,
  AdminActividadController.obtenerActividadesPorSemestre
);

/**
 * @swagger
 * /api/admin/AsistenciaActividad:
 *   get:
 *     summary: Listar asistentes de una actividad
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Devuelve la asistencia registrada para una actividad específica.
 *     parameters:
 *       - in: query
 *         name: id_actividad
 *         schema:
 *           type: integer
 *         required: true
 *         description: Identificador de la actividad.
 *     responses:
 *       200:
 *         description: Lista de asistentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_persona:
 *                     type: integer
 *                   dni:
 *                     type: string
 *                   nombre_persona:
 *                     type: string
 *                   apellido:
 *                     type: string
 *                   carrera:
 *                     type: string
 *                   semestre:
 *                     type: string
 *                   id_estudiante:
 *                     type: integer
 *                   fecha_asistencia:
 *                     type: string
 *                     format: date-time
 *                   activo:
 *                     type: boolean
 *       400:
 *         description: Parámetros inválidos
 *       403:
 *         description: No autorizado
 */
router.get(
  '/AsistenciaActividad',
  verifyToken,
  verifyAdminTutor,
  AdminActividadController.obtenerAsistenciaActividad
);

/**
 * @swagger
 * /api/admin/AsistenciaEstudiante:
 *   put:
 *     summary: Registrar o actualizar la asistencia de un estudiante en una actividad
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
 *               id_actividad:
 *                 type: integer
 *               estado:
 *                 type: boolean
 *               id_estudiante:
 *                 type: integer
 *               id_persona:
 *                 type: integer
 *             required:
 *               - id_actividad
 *               - estado
 *             description: Se debe enviar id_estudiante o id_persona para identificar al alumno.
 *     responses:
 *       200:
 *         description: Estado de asistencia actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 asistencia:
 *                   type: object
 *                 totales:
 *                   type: object
 *                   properties:
 *                     credito_total:
 *                       type: number
 *                     cobro_credito:
 *                       type: number
 *                 nivel:
 *                   type: object
 *                   properties:
 *                     id_nivel:
 *                       type: integer
 *                     nombre_nivel:
 *                       type: string
 *                     rango_inicio:
 *                       type: integer
 *                     rango_fin:
 *                       type: integer
 *                     nombre_imagen:
 *                       type: string
 *                 niveles_pendientes:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Estudiante no encontrado
 */
router.put(
  '/AsistenciaEstudiante',
  verifyToken,
  verifyAdminTutor,
  AdminActividadController.actualizarAsistenciaEstudiante
);

/**
 * @swagger
 * /api/admin/verifyAT:
 *   get:
 *     summary: Verificar si el usuario es tutor o administrador
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Retorna ok si el usuario tiene rol tutor o administrador.
 *     responses:
 *       200:
 *         description: Usuario autorizado como tutor o administrador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: No autorizado
 */
router.get('/verifyAT', verifyToken, verifyAdminTutor, AdminSharedController.verifyGET);

/**
 * @swagger
 * /api/admin/verifyA:
 *   get:
 *     summary: Verificar si el usuario es administrador
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Retorna ok si el usuario tiene rol administrador.
 *     responses:
 *       200:
 *         description: Usuario autorizado como administrador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: No autorizado
 */
router.get('/verifyA', verifyToken, verifyAdmin, AdminSharedController.verifyGET);

/**
 * @swagger
 * /api/admin/IntMostrarEstudiantes:
 *   get:
 *     summary: Inicializar y mostrar lista de estudiantes
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Retorna la lista de estudiantes para usuarios con rol tutor o administrador.
 *     responses:
 *       200:
 *         description: Lista de estudiantes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_persona:
 *                     type: integer
 *                   nombre_persona:
 *                     type: string
 *                   email:
 *                     type: string
 *                   carrera:
 *                     type: string
 *                   semestre:
 *                     type: string
 *                   activo:
 *                     type: boolean
 *       403:
 *         description: No autorizado
 */
router.get(
  '/IntMostrarEstudiantes',
  verifyToken,
  verifyAdminTutor,
  AdminSharedController.initMostrarEstudaintes
);

router.get('/Semestres', verifyToken, verifyAdminTutor, AdminSharedController.obtenerSemestres);

router.get(
  '/exportarExcelEstudiantes',
  verifyToken,
  verifyAdminTutor,
  AdminSharedController.exportarExcelEstudiantes
);

router.get(
  '/exportarExcelActividades',
  verifyToken,
  verifyAdminTutor,
  AdminSharedController.exportarExcelActividades
);

/**
 * @swagger
 * /api/admin/descargar-plantilla:
 *   get:
 *     summary: Descargar plantilla Excel de actividades
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Proporciona el archivo base para registrar actividades nuevas.
 *     responses:
 *       200:
 *         description: Archivo generado correctamente.
 *       403:
 *         description: No autorizado.
 */
router.get(
  '/descargar-plantilla',
  verifyToken,
  verifyAdminTutor,
  AdminSharedController.descargarPlantillaExcel
);

/**
 * @swagger
 * /api/admin/descargar-plantilla-historicos:
 *   get:
 *     summary: Descargar plantilla protegida para carga histórica de asistencias/bonos
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Entrega un .xlsx con encabezados bloqueados y filas preformateadas para cargar eventos históricos.
 *     responses:
 *       200:
 *         description: Archivo generado correctamente.
 *       403:
 *         description: No autorizado.
 */
router.get(
  '/descargar-plantilla-historicos',
  verifyToken,
  verifyAdminTutor,
  AdminSharedController.descargarPlantillaHistoricos
);

router.post(
  '/excel',
  verifyToken,
  verifyAdmin,
  upload.single('file'),
  AdminSharedController.importarExcel
);

/**
 * @swagger
 * /api/admin/importar-historicos:
 *   post:
 *     summary: Importar asistencias/bonos históricos desde Excel
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Procesa la plantilla protegida de carga histórica y actualiza créditos, asistencias y el historial.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Archivo procesado correctamente.
 *       400:
 *         description: Archivo inválido.
 *       403:
 *         description: No autorizado.
 */
router.post(
  '/importar-historicos',
  verifyToken,
  verifyAdminTutor,
  upload.single('file'),
  AdminSharedController.importarHistoricos
);

/**
 * @swagger
 * /api/admin/MostrarTutores:
 *   get:
 *     summary: Mostrar tutores
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol administrador.
 *     responses:
 *       200:
 *         description: Lista de tutores
 *       403:
 *         description: No autorizado
 */
router.get('/MostrarTutores', verifyToken, verifyAdmin, AdminController.MostrarTutor);

/**
 * @swagger
 * /api/admin/DeleteTutores:
 *   delete:
 *     summary: Eliminar tutor
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     description: Solo accesible para usuarios con rol administrador.
 *     parameters:
 *       - in: query
 *         name: id_persona
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del tutor
 *     responses:
 *       200:
 *         description: Tutor eliminado correctamente
 *       403:
 *         description: No autorizado
 */
router.delete('/DeleteTutores', verifyToken, verifyAdmin, AdminController.DeleteTutor);

module.exports = router;
