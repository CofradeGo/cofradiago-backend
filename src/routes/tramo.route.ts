import { Router } from "express";
import * as tramoController from "../controllers/tramo.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router({ mergeParams: true });

/**
 * Guardar el nuevo orden tras arrastrar las filas (solo DMG).
 *
 * Va antes que "/:cortejoId/tramos/:tramoId" para que Express no lea
 * "orden" como si fuera el id de un tramo.
 */
router.patch("/:cortejoId/tramos/orden", authMiddleware, tramoController.reordenarTramos);

router.post("/:cortejoId/tramos", authMiddleware, tramoController.crearTramo);
router.get("/:cortejoId/tramos", authMiddleware, tramoController.listTramos);
router.put("/:cortejoId/tramos/:tramoId", authMiddleware, tramoController.editarTramo);
router.delete("/:cortejoId/tramos/:tramoId", authMiddleware, tramoController.borrarTramo);

export default router;
