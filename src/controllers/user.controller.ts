import type { Request, Response } from "express";
import { UserService } from "../services/user.service.ts";
import type { User } from "../models/user.model.ts";
import z, { ZodError } from "zod";
import { formatZodErrors } from "../utils/zodFormatter.ts";

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
  try {
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

  } catch (error: unknown) {
    if (error instanceof ZodError) {
      // Si la validación falla
      return res.status(400).json({
        message: "Datos inválidos",
        errors: formatZodErrors(error),
      });
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_OLD_PASSWORD":
          return res.status(401).json({ message: error.message });
        default:
          console.error(error);
          return res.status(500).json({ message: "Error interno del servidor" });
      }
    }

    return res.status(500).json({ message: "Error desconocido" });
  }
};


