import { Router } from "express";
import * as insigniaController from "../controllers/insignia.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router();

// Crear una nueva insignia en una cofradía
router.post(
  "/:cofradiaId/insignias",
  authMiddleware,
  insigniaController.crearInsignia
);

// Listar todas las insignias de una cofradía
router.get(
  "/:cofradiaId/insignias",
  authMiddleware,
  insigniaController.listInsignias
);

export default router;
