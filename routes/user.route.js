import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { verifyAdmin, verifyToken } from "../middlewares/jwt.middlware.js";
import { validarLogin } from "../middlewares/validator_entrada.middlware.js";

const router = Router()

// api/v1/users

//router.post('/register', UserController.register)
router.post('/login', validarLogin,UserController.login)
router.get('/login',UserController.ranking)
router.post('/logout',UserController.logout)


export default router;