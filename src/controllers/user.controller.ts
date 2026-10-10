import type { Request, Response } from "express";
import { UserService } from "../services/user.service.ts";
import type { User } from "../models/user.model.ts";
import z from "zod";

export const registerAuxUser = async (req: Request, res: Response) => {
  // El middleware auth agrega req.user
  const dmUser = req.user; // <- ya está tipado gracias al .d.ts
  const { username, password, email } = req.body;

  const newUser = await UserService.registerAuxUser(dmUser, {
    username,
    password,
    email,
  });

  return res.status(201).json({
    message: "Usuario AUX creado correctamente.",
    user: newUser,
  });
  

};

export const deleteUser = async (req: Request, res: Response) => {
  const dmUser = req.user!; // authMiddleware asegura que existe
  const targetUserId = Number(req.params.targetUserId);

  const updatedUser = await UserService.deactivateUser(dmUser, targetUserId);

  return res.status(200).json({
    message: `Usuario ${updatedUser.username} desactivado correctamente`,
    user: updatedUser,
  });
  
};

export const getUsers = async (req: Request, res: Response) => {
  const requestingUser = req.user as User;

  const users = await UserService.getUsers(requestingUser);
  return res.status(200).json({ users });
  
};

// Definimos el esquema para actualizar un usuario
export const updateUserSchema = z
  .object({
    username: z.string().min(3, "Username demasiado corto").optional(),
    email: z.string().email("Email inválido").optional(),
    oldPassword: z.string().min(6, "Contraseña antigua demasiado corta").optional(),
    newPassword: z.string().min(6, "Nueva contraseña demasiado corta").optional(),
  })
  .refine((data) => {
    // Si se intenta cambiar la contraseña, oldPassword debe estar presente
    if (data.newPassword) {
      return !!data.oldPassword;
    }
    return true; // Si no se cambia contraseña, no hace falta oldPassword
  }, {
    message: "Debes proporcionar la contraseña antigua para cambiar la nueva",
    path: ["oldPassword"], // indica que el error corresponde a este campo
  });

export const updateUser = async (req: Request, res: Response) => {
  const currentUser = req.user as User; // inyectado por authMiddleware

  // Validación Zod
  const parsedData = updateUserSchema.parse(req.body);

  const { username, email, oldPassword, newPassword } = parsedData;

  const updatedUser = await UserService.updateUser(currentUser, {
    username,
    email,
    oldPassword,
    newPassword,
  });

  return res.status(200).json({
    message: "Usuario actualizado correctamente",
    user: updatedUser,
  });

  
};


