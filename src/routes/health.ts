import { Router } from "express";
import { healthController } from "../controllers/healthController.ts";

export const healthRouter = Router();

healthRouter.get("/", healthController.getHealth);
