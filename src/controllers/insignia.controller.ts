import type { Request, Response } from "express";
import { insigniaService } from "../services/insignia.service.ts";
import type { User } from "../models/user.model.ts";

interface CrearInsigniaBody {
  nombre: string;
  descripcion?: string;
  cortejoId?: number;
}

export const crearInsignia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;

    if (!user) {
      return res.status(401).json({
        message: "Usuario no autenticado. Por favor, inicia sesión.",
      });
    }

    if (user.role !== "DMG") {
      return res.status(403).json({
        message: "Acceso denegado. Solo usuarios con rol DMG pueden crear insignias.",
      });
    }

    const cofradiaIdParam = req.params.cofradiaId;
    if (!cofradiaIdParam) {
      return res.status(400).json({ message: "Parámetro cofradía obligatorio" });
    }

    const { nombre, descripcion, cortejoId } = req.body as CrearInsigniaBody;

    if (!nombre) {
      return res.status(400).json({
        message: "Datos incompletos: se requiere el nombre de la insignia.",
      });
    }

    const input = {
      cofradiaId: Number(cofradiaIdParam),
      nombre,
      ...(descripcion !== undefined && { descripcion }),
      ...(cortejoId !== undefined && { cortejoId: Number(cortejoId) }),
    };

    const insignia = await insigniaService.crearInsignia(input);

    return res.status(201).json({
      message: `Insignia "${insignia.nombre}" creada correctamente en la cofradía.`,
      insignia,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada" });
        case "COFRADIA_CERRADA":
          return res.status(400).json({
            message: "No se pueden crear insignias en cofradías cerradas",
          });
        default:
          if (error.message.includes("Ya existe una insignia")) {
            return res.status(409).json({ message: error.message });
          }
          console.error("Error al crear insignia:", error);
          return res.status(500).json({
            message: `Error al crear la insignia: ${error.message}`,
          });
      }
    }

    console.error("Error desconocido al crear insignia:", error);
    return res.status(500).json({
      message: "Error desconocido al crear la insignia.",
    });
  }
};


/**
 * GET /api/v1/cofradias/:cofradiaId/insignias
 * Listar insignias de una cofradía
 */
export const listInsignias = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;

    if (!user) {
      return res.status(401).json({
        message: "Usuario no autenticado. Por favor, inicia sesión.",
      });
    }

    const cofradiaIdParam = req.params.cofradiaId;
    if (!cofradiaIdParam) {
      return res.status(400).json({
        message: "Parámetro cofradía obligatorio",
      });
    }

    const insignias = await insigniaService.listInsigniasByCofradia(
      Number(cofradiaIdParam)
    );

    return res.status(200).json(insignias);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error al listar insignias:", error);
      return res.status(500).json({
        message: `Error al listar las insignias: ${error.message}`,
      });
    }

    console.error("Error desconocido al listar insignias:", error);
    return res.status(500).json({
      message: "Error desconocido al listar las insignias.",
    });
  }
};