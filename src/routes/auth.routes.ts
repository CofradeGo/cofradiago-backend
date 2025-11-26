import { Router } from "express";
import * as authController from "../controllers/auth.controller.ts";

const router = Router();

// Endpoint login con domain como path parameter
router.post("/login/:domain", authController.login);

export default router;
