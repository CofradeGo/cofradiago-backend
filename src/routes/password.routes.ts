import { Router } from "express";
import * as passwordController from "../controllers/password.controller.ts";

const router = Router();

/**
 * POST /api/v1/password/forgot
 * Genera un token de reseteo de contraseña para un usuario
 */
router.post("/forgot", passwordController.forgotPassword);

/**
 * POST /api/v1/password/reset
 * Resetea la contraseña usando un token válido
 */
router.post("/reset", passwordController.resetPassword);

export default router;
