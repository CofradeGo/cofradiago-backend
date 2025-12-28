import type { Request, Response } from "express";
import { cortejoService } from "../services/cortejo.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias/:cofradiaId/cortejos
 * @description Crear un nuevo cortejo para una cofradía
 */
export const crearCortejo = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const { cofradiaId } = req.params;
    const { nombre, orden } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Usuario no autenticado. Por favor, inicia sesión." });
    }

    if (user.role !== "DMG") {
      return res.status(403).json({ message: "Acceso denegado. Solo usuarios con rol DMG pueden crear cortejos." });
    }

    if (!cofradiaId || !nombre || orden === undefined) {
      return res.status(400).json({ message: "Datos incompletos: se requiere cofradía, nombre y orden del cortejo." });
    }

    const cortejo = await cortejoService.crearCortejo({
      cofradiaId: Number(cofradiaId),
      nombre,
      orden: Number(orden),
    });

    return res.status(201).json({
      message: `Cortejo "${cortejo.nombre}" creado correctamente en la cofradía.`,
      cortejo,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada." });
        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "No se pueden crear cortejos en cofradías cerradas." });
        default:
          if (error.message.includes("Ya existe un cortejo")) {
            return res.status(409).json({ message: error.message });
          }
          console.error("Error al crear cortejo:", error);
          return res.status(500).json({ message: `Error al crear cortejo: ${error.message}` });
      }
    }

    console.error("Error desconocido al crear cortejo:", error);
    return res.status(500).json({ message: "Error desconocido al crear cortejo." });
  }
};

/**
 * GET /api/v1/cofradias/:cofradiaId/cortejos
 * @description Listar todos los cortejos de una cofradía
 */
export const listCortejosByCofradia = async (req: Request, res: Response) => {
  try {
    const { cofradiaId } = req.params;

    if (!cofradiaId) {
      return res.status(400).json({ message: "Parámetro cofradiaId obligatorio." });
    }

    const cortejos = await cortejoService.listCortejosByCofradia(Number(cofradiaId));

    return res.status(200).json(cortejos);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error al listar cortejos:", error);
      return res.status(500).json({ message: `Error al listar cortejos: ${error.message}` });
    }

    console.error("Error desconocido al listar cortejos:", error);
    return res.status(500).json({ message: "Error desconocido al listar cortejos." });
  }
};
