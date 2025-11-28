import { Router } from "express";
import { getHermandad } from "../controllers/hermandad.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router();

// GET /api/hermandad/:domain
router.get("/:domain", authMiddleware, getHermandad);

export default router;
