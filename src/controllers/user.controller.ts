import type { Request, Response } from "express";
import { UserService } from "../services/user.service.ts";
import type { User } from "../models/user.model.ts";

export const registerAuxUser = async (req: Request, res: Response) => {
  try {
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
  } catch (error: unknown) {
  console.error(error);

  let message = "Error al crear usuario AUX";

  if (error instanceof Error) {
    message = error.message;
  }

  return res.status(400).json({
    error: message,
  });
}

};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const dmUser = req.user!; // authMiddleware asegura que existe
    const targetUserId = Number(req.params.targetUserId);

    const updatedUser = await UserService.deactivateUser(dmUser, targetUserId);

    return res.status(200).json({
      message: `Usuario ${updatedUser.username} desactivado correctamente`,
      user: updatedUser,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "FORBIDDEN_ACTION":
        case "CANNOT_DELETE_SELF":
          return res.status(403).json({ message: error.message });
        case "USER_NOT_FOUND":
          return res.status(404).json({ message: error.message });
        default:
          console.error(error);
          return res.status(500).json({ message: "Error interno del servidor" });
      }
    }
    return res.status(500).json({ message: "Error desconocido" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const requestingUser = req.user as User;

    const users = await UserService.getUsers(requestingUser);
    return res.status(200).json({ users });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "USER_NOT_FOUND":
          return res.status(404).json({ message: "Usuario no encontrado" });
        case "NO_PERMISSION":
          return res.status(403).json({ message: "No tienes permisos" });
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

