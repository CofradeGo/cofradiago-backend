import { Router } from "express";
import { getHermandad, getPublicHdad, updateHermandad } from "../controllers/hermandad.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router();

// GET /api/hermandad/:domain
router.get("/:domain", authMiddleware, getHermandad);
// GET /public/hermandad/:domain
router.get("/hermandad/:domain", getPublicHdad);

// PUT /api/v1/hermandad/:domain
router.put("/:domain", authMiddleware, updateHermandad);

export default router;
