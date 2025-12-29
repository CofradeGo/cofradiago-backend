import { Router } from "express";
import {
  crearPuesto,
  listPuestos,
  editarPuesto,
  borrarPuesto,
} from "../controllers/puesto.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router();

/* =====================================================
   PUESTOS
===================================================== */

/**
 * Crear puesto (solo DMG)
 * POST /api/v1/cofradias/:cofradiaId/puestos
 */
router.post(
  "/:cofradiaId/puestos",
  authMiddleware,
  crearPuesto
);

/**
 * Listar puestos de una cofradía
 * GET /api/v1/cofradias/:cofradiaId/puestos
 */
router.get(
  "/:cofradiaId/puestos",
  authMiddleware,
  listPuestos
);

/**
 * Editar puesto (solo DMG)
 * PUT /api/v1/cofradias/:cofradiaId/puestos/:puestoId
 */
router.put(
  "/:cofradiaId/puestos/:puestoId",
  authMiddleware,
  editarPuesto
);

/**
 * Borrar puesto (solo DMG)
 * DELETE /api/v1/cofradias/:cofradiaId/puestos/:puestoId
 */
router.delete(
  "/:cofradiaId/puestos/:puestoId",
  authMiddleware,
  borrarPuesto
);

export default router;
