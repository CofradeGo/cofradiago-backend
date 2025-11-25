import type { Request, Response } from "express";
import { getAllTests } from "../services/testService.ts";

export const getTests = async (req: Request, res: Response) => {
  try {
    const tests = await getAllTests();
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error retrieving tests" });
  }
};
