import { Router } from "express";
import { crearPuesto, listPuestos } from "../controllers/puesto.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router();

// Crear puesto (DMG)
router.post("/:cofradiaId/puestos", authMiddleware, crearPuesto);

// Listar puestos de una cofradía
router.get("/:cofradiaId/puestos", authMiddleware, listPuestos);

export default router;
