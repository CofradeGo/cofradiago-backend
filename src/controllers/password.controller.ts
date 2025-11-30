import type { Request, Response } from "express";
import { PasswordService } from "../services/password.service.ts";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "El campo username es obligatorio" });
    }

    const token = await PasswordService.createResetToken(username);

    // Aquí iría la lógica de envío de email con el token
    // Por ahora solo devolvemos el token para pruebas
    return res.status(200).json({
      message: "Token de reseteo generado correctamente",
      token,
    });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      switch (error.message) {
        case "USER_NOT_FOUND":
          return res.status(404).json({ message: "Usuario no encontrado" });
        default:
          return res.status(500).json({ message: "Error interno del servidor" });
      }
    }
    return res.status(500).json({ message: "Error desconocido" });
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
        default:
          return res.status(500).json({ message: "Error interno del servidor" });
      }
    }
    return res.status(500).json({ message: "Error desconocido" });
  }
};
