import type { Request, Response } from "express";
import * as authService from "../services/auth.service.ts";

export const login = async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const { username, password } = req.body;

    // Validación de campos obligatorios
    if (!domain || !username || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Llamada al service para autenticar
    const token = await authService.login(domain, username, password);

    return res.status(200).json({ token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "HERMANDAD_NOT_FOUND":
          return res.status(404).json({ message: "Hermandad no encontrada" });
        case "INVALID_CREDENTIALS":
          return res.status(401).json({ message: "Credenciales inválidas" });
        default:
          console.error(error);
          return res.status(500).json({ message: "Error interno del servidor" });
      }
    } else {
      console.error(error);
      return res.status(500).json({ message: "Error desconocido" });
    }
  }
};
