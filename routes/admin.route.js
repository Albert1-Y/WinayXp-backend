import { Router } from "express";
import { AdminController,AdminSharedController } from "../controllers/admin.controller.js";
import { AdminActividadController } from "../controllers/admin.controller.actividad.js";   
import { verifyAdmin, verifyAdminTutor, verifyToken } from "../middlewares/jwt.middlware.js";


const router = Router()

// api/v1/users
router.get('/init',verifyToken,verifyAdminTutor,AdminSharedController.initAdminTutor)
//REGISTRO DE ADMIN Y TUTOR

router.post('/registerAT',verifyToken,verifyAdmin, AdminController.register_Admin_tutor)
//REGISTER ESTUDIANTE

router.post('/registerE', verifyToken,verifyAdminTutor,AdminSharedController.registeEstudiante)
router.post('/registerME', AdminSharedController.registerMultipleEstudiantes)
//crear actividad admin-funcion compartida con tutor

router.post('/crearActividad',verifyToken,verifyAdminTutor,AdminActividadController.crearActividad)

router.get('/DatosEstudiante',verifyToken, verifyAdminTutor,AdminSharedController.DatosEstudiante)

router.delete('/EliminarEstudiante',verifyToken,verifyAdminTutor,AdminSharedController.DeleteEstudiante)

router.delete('/EliminarActividad',verifyToken, verifyAdminTutor,AdminActividadController.DeleteActividad)

router.get('/MostrarActividad',verifyToken, verifyAdminTutor,AdminActividadController.MostrarActividad)

router.get('/verifyAT',verifyToken, verifyAdminTutor, AdminSharedController.verifyGET)

router.get('/verifyA',verifyToken, verifyAdmin, AdminSharedController.verifyGET)

router.get('/IntMostrarEstudiantes',verifyToken,verifyAdminTutor,AdminSharedController.initMostrarEstudaintes)

router.get('/MostrarTutores',verifyToken,verifyAdmin,AdminController.MostrarTutor)
router.delete('/DeleteTutores',verifyToken,verifyAdmin,AdminController.DeleteTutor)


export default router;