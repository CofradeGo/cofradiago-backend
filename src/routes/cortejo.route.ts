import { Router } from "express";
import { 
  crearCortejo, 
  listCortejosByCofradia, 
  editarCortejo, 
  borrarCortejo,
  reordenarCortejos 
} from "../controllers/cortejo.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import { obtenerProcesion } from "../controllers/procesion.controller.ts";

const router = Router({ mergeParams: true });

/**
 * Guardar el nuevo orden tras arrastrar las filas (solo DMG).
 *
 * Se declara antes que "/:cortejoId" para que Express no lea "orden"
 * como si fuera un id de cortejo.
 */
router.patch("/orden", authMiddleware, reordenarCortejos);

// Crear cortejo (solo DMG)
router.post("/", authMiddleware, crearCortejo);

// Listar cortejos de una cofradía (DMG y AUX pueden consultar)
router.get("/", authMiddleware, listCortejosByCofradia);

// Procesión completa: tramos, puestos y hermanos. DMG y AUX.
router.get("/:cortejoId/procesion", authMiddleware, obtenerProcesion);

// Editar cortejo por ID (solo DMG)
router.put("/:cortejoId", authMiddleware, editarCortejo);

// Borrar cortejo por ID (solo DMG)
router.delete("/:cortejoId", authMiddleware, borrarCortejo);

export default router;
