import type { Request, Response } from "express";
import { healthService } from "../services/healthService.ts";

export const healthController = {
  getHealth: (_req: Request, res: Response) => {
    const data = healthService.getStatus();
    res.json(data);
  },
};
