import { Router } from "express";
import { login, logoutController, refreshToken } from "../controllers/auth.controller.ts";

const router = Router();

// Endpoint login
router.post("/login/:domain", login); // ✅ controller, no service

// Endpoint refresh token
router.post("/refresh-token", refreshToken);

// Logout
router.post("/logout", logoutController);

export default router;
