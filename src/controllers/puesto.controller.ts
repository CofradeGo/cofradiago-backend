import type { Request, Response } from "express";
import { puestoService } from "../services/puesto.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias/:cofradiaId/puestos
 * @description Crea un nuevo puesto en una cofradía
 */
export const crearPuesto = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;

    if (!user) {
      return res.status(401).json({
        message: "Usuario no autenticado. Por favor, inicia sesión.",
      });
    }

    // Solo DMG puede crear puestos
    if (user.role !== "DMG") {
      return res.status(403).json({
        message: "Acceso denegado. Solo usuarios con rol DMG pueden crear puestos.",
      });
    }

    const { cofradiaId } = req.params;
    const { nombre, codigo } = req.body;

    if (!cofradiaId || !nombre) {
      return res.status(400).json({
        message: "Datos incompletos: se requiere cofradía y nombre del puesto.",
      });
    }

    const puesto = await puestoService.crearPuesto({
      cofradiaId: Number(cofradiaId),
      nombre,
      codigo, // código opcional
    });

    return res.status(201).json({
      message: `Puesto "${puesto.nombre}" creado correctamente en la cofradía.`,
      puesto,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada" });
        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "No se pueden crear puestos en cofradías cerradas" });
        default:
          if (error.message.includes("Ya existe un puesto")) {
            return res.status(409).json({ message: error.message });
          }
          console.error("Error al crear puesto:", error);
          return res.status(500).json({ message: `Error al crear el puesto: ${error.message}` });
      }
    }

    console.error("Error desconocido al crear puesto:", error);
    return res.status(500).json({ message: "Error desconocido al crear el puesto." });
  }
};

/**
 * GET /api/v1/cofradias/:cofradiaId/puestos
 * @description Listar puestos de una cofradía
 */
export const listPuestos = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;

    if (!user) {
      return res.status(401).json({ message: "Usuario no autenticado. Por favor, inicia sesión." });
    }

    const { cofradiaId } = req.params;

    if (!cofradiaId) {
      return res.status(400).json({ message: "Parámetro cofradía obligatorio" });
    }

    const puestos = await puestoService.listPuestosByCofradia(Number(cofradiaId));

    return res.status(200).json(puestos);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error al listar puestos:", error);
      return res.status(500).json({ message: `Error al listar los puestos: ${error.message}` });
    }

    console.error("Error desconocido al listar puestos:", error);
    return res.status(500).json({ message: "Error desconocido al listar los puestos." });
  }
};
