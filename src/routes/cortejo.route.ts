import { Router } from "express";
import { 
  crearCortejo, 
  listCortejosByCofradia, 
  editarCortejo, 
  borrarCortejo 
} from "../controllers/cortejo.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router({ mergeParams: true });

// Crear cortejo (solo DMG)
router.post("/", authMiddleware, crearCortejo);

// Listar cortejos de una cofradía (DMG y AUX pueden consultar)
router.get("/", authMiddleware, listCortejosByCofradia);

// Editar cortejo por ID (solo DMG)
router.put("/:cortejoId", authMiddleware, editarCortejo);

// Borrar cortejo por ID (solo DMG)
router.delete("/:cortejoId", authMiddleware, borrarCortejo);

export default router;
