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
    // Verificamos token y casteamos al payload definido
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

    // Guardamos info del usuario en req.user para usar en endpoints
    req.user = decoded;

    next();
  } catch (err: unknown) {
    // Hacemos un type guard para asegurarnos de que es un Error
    if (err instanceof Error) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token expirado, usa refresh token" });
      }

      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Token inválido" });
      }

      // Otros errores
      return res.status(500).json({ message: "Error inesperado" });
    }

    // Por si err no es un Error (muy raro)
    return res.status(500).json({ message: "Error desconocido" });
  }
};
