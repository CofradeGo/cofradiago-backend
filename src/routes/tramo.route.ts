import { Router } from "express";
import * as tramoController from "../controllers/tramo.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router({ mergeParams: true });

router.post("/:cortejoId/tramos", authMiddleware, tramoController.crearTramo);
router.get("/:cortejoId/tramos", authMiddleware, tramoController.listTramos);
router.put("/:cortejoId/tramos/:tramoId", authMiddleware, tramoController.editarTramo);
router.delete("/:cortejoId/tramos/:tramoId", authMiddleware, tramoController.borrarTramo);

export default router;
