import { Router } from "express";
import { crearCortejo, listCortejosByCofradia } from "../controllers/cortejo.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router({ mergeParams: true });

// Solo DMG puede crear cortejos
router.post("/", authMiddleware, crearCortejo);

// Listar cortejos de una cofradía (DMG y AUX pueden consultar)
router.get("/", authMiddleware, listCortejosByCofradia);

export default router;
