import type { Request, Response } from "express";
import { cortejoService } from "../services/cortejo.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias/:cofradiaId/cortejos
 */
export const crearCortejo = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const { cofradiaId } = req.params;
    const { nombre, orden } = req.body;

    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo DMG puede crear cortejos." });
    if (!cofradiaId || !nombre || orden === undefined)
      return res.status(400).json({ message: "Datos incompletos." });

    const cortejo = await cortejoService.crearCortejo({
      cofradiaId: Number(cofradiaId),
      nombre,
      orden: Number(orden),
    });

    return res.status(201).json({ message: `Cortejo "${cortejo.nombre}" creado.`, cortejo });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND": return res.status(404).json({ message: "Cofradía no encontrada." });
        case "COFRADIA_CERRADA": return res.status(400).json({ message: "No se pueden crear cortejos en cofradías cerradas." });
        default:
          if (error.message.includes("Ya existe un cortejo")) return res.status(409).json({ message: error.message });
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
 */
export const listCortejosByCofradia = async (req: Request, res: Response) => {
  try {
    const { cofradiaId } = req.params;
    if (!cofradiaId) return res.status(400).json({ message: "Parámetro cofradiaId obligatorio." });

    const cortejos = await cortejoService.listCortejosByCofradia(Number(cofradiaId));
    return res.status(200).json(cortejos);
  } catch (error: unknown) {
    console.error("Error al listar cortejos:", error);
    return res.status(500).json({ message: "Error desconocido al listar cortejos." });
  }
};

/**
 * PUT /api/v1/cortejos/:cortejoId
 * Editar un cortejo
 */
export const editarCortejo = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const { cortejoId } = req.params;
    const { nombre, orden } = req.body;

    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo DMG puede editar cortejos." });
    if (!cortejoId) return res.status(400).json({ message: "Parámetro cortejoId obligatorio." });

    const cortejo = await cortejoService.editarCortejo(Number(cortejoId), { nombre, orden });
    return res.status(200).json({ message: `Cortejo "${cortejo.nombre}" actualizado.`, cortejo });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "CORTEJO_NOT_FOUND": return res.status(404).json({ message: "Cortejo no encontrado." });
        case "COFRADIA_CERRADA": return res.status(400).json({ message: "No se pueden editar cortejos de cofradías cerradas." });
      }
      console.error("Error al editar cortejo:", error);
      return res.status(500).json({ message: `Error al editar cortejo: ${error.message}` });
    }
    console.error("Error desconocido al editar cortejo:", error);
    return res.status(500).json({ message: "Error desconocido al editar cortejo." });
  }
};

/**
 * DELETE /api/v1/cortejos/:cortejoId
 * Borrar un cortejo
 */
export const borrarCortejo = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const { cortejoId } = req.params;

    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo DMG puede borrar cortejos." });
    if (!cortejoId) return res.status(400).json({ message: "Parámetro cortejoId obligatorio." });

    const cortejo = await cortejoService.borrarCortejo(Number(cortejoId));
    return res.status(200).json({ message: `Cortejo "${cortejo.nombre}" eliminado.`, cortejo });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "CORTEJO_NOT_FOUND": return res.status(404).json({ message: "Cortejo no encontrado." });
        case "COFRADIA_CERRADA": return res.status(400).json({ message: "No se pueden borrar cortejos de cofradías cerradas." });
      }
      console.error("Error al borrar cortejo:", error);
      return res.status(500).json({ message: `Error al borrar cortejo: ${error.message}` });
    }
    console.error("Error desconocido al borrar cortejo:", error);
    return res.status(500).json({ message: "Error desconocido al borrar cortejo." });
  }
};
