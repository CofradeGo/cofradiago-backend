import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.ts";
import {
  crearCargo,
  listCargos,
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

export default router;
