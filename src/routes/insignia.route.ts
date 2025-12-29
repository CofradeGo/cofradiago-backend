import { Router } from "express";
import * as insigniaController from "../controllers/insignia.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router({ mergeParams: true });

// Crear una nueva insignia en una cofradía (solo DMG)
router.post("/:cofradiaId/insignias", authMiddleware, insigniaController.crearInsignia);

// Listar todas las insignias de una cofradía (DMG y AUX)
router.get("/:cofradiaId/insignias", authMiddleware, insigniaController.listInsignias);

// Editar una insignia existente por ID (solo DMG)
router.put("/:cofradiaId/insignias/:insigniaId", authMiddleware, insigniaController.editarInsignia);

// Borrar una insignia existente por ID (solo DMG)
router.delete("/:cofradiaId/insignias/:insigniaId", authMiddleware, insigniaController.borrarInsignia);

export default router;
