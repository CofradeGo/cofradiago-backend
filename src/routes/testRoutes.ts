import { Router } from "express";
import { getTests } from "../controllers/testController.ts";

const router = Router();

router.get("/test", getTests);

export default router;
