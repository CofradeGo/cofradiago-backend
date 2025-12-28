import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import { cofradiaController } from "../controllers/cofradia.controller.ts";

const router = Router();

// Crear una cofradía (solo DMG)
router.post("/", authMiddleware, cofradiaController.crearCofradia);

// Listar cofradías de la hermandad (DMG y AUX pueden consultar)
// router.get("/", authMiddleware, cofradiaController.listCofradias);

// Detalle de una cofradía por ID
// router.get("/:cofradiaId", authMiddleware, cofradiaController.getCofradiaById);

export default router;
