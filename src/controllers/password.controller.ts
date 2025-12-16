import type { Request, Response } from "express";
import { PasswordService } from "../services/password.service.ts";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { username, domain } = req.body;

    if (!username || !domain) {
      return res.status(400).json({ message: "Username y domain son obligatorios" });
    }

    // Llama al service que genera token y envía el email
    await PasswordService.createResetToken(username, domain);

    // Respuesta genérica: no revela si el usuario existe o no
    return res.status(200).json({
      message: "Si el usuario existe, se ha enviado un email con instrucciones para recuperar la contraseña",
    });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token y nueva contraseña son obligatorios" });
    }

    const result = await PasswordService.resetPassword(token, newPassword);

    return res.status(200).json(result);
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_OR_EXPIRED_TOKEN":
          return res.status(400).json({ message: "Token inválido o expirado" });
        case "WEAK_PASSWORD":
          return res.status(400).json({ message: "La nueva contraseña es demasiado débil" });
        default:
          return res.status(500).json({ message: "Error interno del servidor" });
      }
    }
    return res.status(500).json({ message: "Error desconocido" });
  }
};
