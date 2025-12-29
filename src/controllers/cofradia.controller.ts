import type { Request, Response } from "express";
import { cofradiaService, type ListCofradiasOptions, type ActualizarCofradiaInput } from "../services/cofradia.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias
 */
export const crearCofradia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado. Por favor, inicia sesión." });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo usuarios DMG pueden crear cofradías." });

    const { nombre, anio, tipo } = req.body;
    if (!nombre || !anio || !tipo) return res.status(400).json({ message: "Datos incompletos" });

    const cofradia = await cofradiaService.crearCofradia({ hermandadId: user.hermandadId, nombre, anio, tipo });

    return res.status(201).json({ message: `Cofradía "${cofradia.nombre}" creada correctamente`, cofradia });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Ya existe una cofradía")) return res.status(409).json({ message: error.message });
      console.error("Error al crear cofradía:", error);
      return res.status(500).json({ message: `Error al crear la cofradía: ${error.message}` });
    }
    return res.status(500).json({ message: "Error desconocido al crear la cofradía." });
  }
};

/**
 * GET /api/v1/cofradias
 */
export const listCofradias = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado" });

    const orderQuery: "asc" | "desc" = (req.query.order as "asc" | "desc") || "desc";
    const estadoQuery: "ABIERTA" | "CERRADA" | undefined = req.query.estado as "ABIERTA" | "CERRADA" | undefined;

    const options: ListCofradiasOptions = {
      hermandadId: user.hermandadId,
      order: orderQuery,
      ...(estadoQuery !== undefined && { estado: estadoQuery }),
    };

    const cofradias = await cofradiaService.listCofradias(options);
    return res.status(200).json(cofradias);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error al listar cofradías:", error);
      return res.status(500).json({ message: `Error al listar cofradías: ${error.message}` });
    }
    return res.status(500).json({ message: "Error desconocido al listar cofradías." });
  }
};

/**
 * PUT /api/v1/cofradias/:cofradiaId
 */
export const actualizarCofradia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado" });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo usuarios DMG pueden editar cofradías" });

    const { cofradiaId } = req.params;
    const data: ActualizarCofradiaInput = req.body;

    if (!cofradiaId) return res.status(400).json({ message: "Parámetro cofradía obligatorio" });

    const cofradia = await cofradiaService.actualizarCofradia(Number(cofradiaId), data);
    return res.status(200).json({ message: "Cofradía actualizada correctamente", cofradia });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada" });
        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "No se pueden modificar cofradías cerradas" });
        default:
          console.error("Error al actualizar cofradía:", error);
          return res.status(500).json({ message: `Error al actualizar la cofradía: ${error.message}` });
      }
    }
    return res.status(500).json({ message: "Error desconocido al actualizar la cofradía" });
  }
};

/**
 * DELETE /api/v1/cofradias/:cofradiaId
 */
export const borrarCofradia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado" });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo usuarios DMG pueden borrar cofradías" });

    const { cofradiaId } = req.params;
    if (!cofradiaId) return res.status(400).json({ message: "Parámetro cofradía obligatorio" });

    const result = await cofradiaService.borrarCofradia(Number(cofradiaId));
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada" });
        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "No se pueden borrar cofradías cerradas" });
        default:
          console.error("Error al borrar cofradía:", error);
          return res.status(500).json({ message: `Error al borrar la cofradía: ${error.message}` });
      }
    }
    return res.status(500).json({ message: "Error desconocido al borrar la cofradía" });
  }
};
