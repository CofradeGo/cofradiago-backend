import { Router } from "express";
import { hermanoController } from "../controllers/hermano.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router();

// GET /hermandades/hermanos
// Lista los hermanos activos de la hermandad del usuario autenticado
router.get("/", authMiddleware, hermanoController.listHermanos);

export default router;
