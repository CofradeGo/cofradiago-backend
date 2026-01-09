import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import {
  crearCofradia,
  listCofradias,
  actualizarCofradia,
  borrarCofradia,
  clonarCofradia,
} from "../controllers/cofradia.controller.ts";

const router = Router();

// Crear una cofradía (solo DMG)
router.post("/", authMiddleware, crearCofradia);

// Listar cofradías de la hermandad (DMG y AUX pueden consultar)
router.get("/", authMiddleware, listCofradias);

// Actualizar cofradía por ID (solo DMG, solo si está ABIERTA)
router.put("/:cofradiaId", authMiddleware, actualizarCofradia);

// Borrar cofradía por ID (solo DMG, solo si está ABIERTA)
router.delete("/:cofradiaId", authMiddleware, borrarCofradia);

// Clonar cofradía por ID (solo DMG)
router.post("/:cofradiaId/clonar", authMiddleware, clonarCofradia);

export default router;
