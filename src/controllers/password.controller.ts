import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { PasswordService } from "../services/password.service.ts";

export const forgotPassword = async (req: Request, res: Response) => {
  const { username, domain } = req.body;

  if (!username || !domain) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Username y domain son obligatorios",
    });
  }

  // Llama al service que genera token y envía el email
  await PasswordService.createResetToken(username, domain);

  // Respuesta genérica: no revela si el usuario existe o no
  return res.status(200).json({
    message: "Si el usuario existe, se ha enviado un email con instrucciones para recuperar la contraseña",
  });
  
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Token y nueva contraseña son obligatorios",
    });
  }

  const result = await PasswordService.resetPassword(token, newPassword);

  return res.status(200).json(result);
  
};
