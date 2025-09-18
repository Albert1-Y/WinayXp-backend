import { Router } from "express";
import { EstudianteController } from "../controllers/estudiante.controller.js"; 
import {  verifyToken,verifyEstudiante } from "../middlewares/jwt.middlware.js";

const router = Router()

// api/v1/users

//router.post('/register', UserController.register)
router.get('/InitEstudiante', verifyToken,verifyEstudiante,EstudianteController.InitEstudiante)



export default router;