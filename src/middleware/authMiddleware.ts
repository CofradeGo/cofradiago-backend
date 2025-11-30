import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { TokenPayload } from "../models/auth.model.ts";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
  return res.status(401).json({ message: "Token no válido" });
}

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as unknown as TokenPayload;

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido, error:" + error });
  }
};
