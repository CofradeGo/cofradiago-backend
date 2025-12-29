import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import {
  crearCargo,
  listCargos,
  editarCargo,
  borrarCargo,
} from "../controllers/cargo.controller.ts";

const router = Router();

/**
 * POST /api/v1/cofradias/:cofradiaId/cargos
 * Crear un cargo en una cofradía (solo DMG)
 */
router.post(
  "/:cofradiaId/cargos",
  authMiddleware,
  crearCargo
);

/**
 * GET /api/v1/cofradias/:cofradiaId/cargos
 * Listar cargos de una cofradía (DMG y AUX)
 */
router.get(
  "/:cofradiaId/cargos",
  authMiddleware,
  listCargos
);

/**
 * PUT /api/v1/cofradias/:cofradiaId/cargos/:cargoId
 * Editar un cargo (solo DMG)
 */
router.put(
  "/:cofradiaId/cargos/:cargoId",
  authMiddleware,
  editarCargo
);

/**
 * DELETE /api/v1/cofradias/:cofradiaId/cargos/:cargoId
 * Borrar un cargo (solo DMG)
 */
router.delete(
  "/:cofradiaId/cargos/:cargoId",
  authMiddleware,
  borrarCargo
);

export default router;
