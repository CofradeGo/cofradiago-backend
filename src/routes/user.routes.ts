import { Router } from "express";
import { deleteUser, getUsers, registerAuxUser } from "../controllers/user.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router();

// Solo los DMG pueden crear usuarios AUX
router.post("/register", authMiddleware, registerAuxUser);
router.patch("/:targetUserId", authMiddleware, deleteUser);
router.get("/", authMiddleware, getUsers);

export default router;
