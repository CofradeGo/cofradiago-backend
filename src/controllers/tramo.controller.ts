import type { Request, Response } from "express";
import { tramoService } from "../services/tramos.service.ts";
import type { User } from "../models/user.model.ts";

/* =====================================================
   CREAR TRAMO (DMG)
===================================================== */
export const crearTramo = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });
    if (user.role !== "DMG")
      return res.status(403).json({ message: "Solo usuarios DMG pueden crear tramos." });

    const { cofradiaId, cortejoId } = req.params;
    const { nombre, orden } = req.body;

    if (!cofradiaId || !cortejoId || !nombre) {
      return res.status(400).json({
        message: "cofradiaId, cortejoId y nombre son obligatorios.",
      });
    }

    const tramo = await tramoService.crearTramo({
      cofradiaId: Number(cofradiaId),
      cortejoId: Number(cortejoId),
      nombre,
      ...(orden !== undefined && { orden }),
    });

    return res.status(201).json({ message: "Tramo creado correctamente.", tramo });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada." });
        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "La cofradía está cerrada." });
        case "CORTEJO_NOT_FOUND":
          return res.status(404).json({ message: "Cortejo no encontrado." });
        case "CORTEJO_NOT_BELONG_TO_COFRADIA":
          return res.status(400).json({ message: "El cortejo no pertenece a la cofradía." });
        case "TRAMO_DUPLICADO":
          return res.status(409).json({ message: "Ya existe un tramo con ese nombre." });
      }
    }

    console.error(error);
    return res.status(500).json({ message: "Error interno al crear tramo." });
  }
};

/* =====================================================
   LISTAR TRAMOS (DMG | AUXILIAR)
===================================================== */
export const listTramos = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });

    if (!["DMG", "AUXILIAR"].includes(user.role)) {
      return res.status(403).json({ message: "No tienes permisos para listar tramos." });
    }

    const { cofradiaId, cortejoId } = req.params;

    const tramos = await tramoService.listarTramos(
      Number(cofradiaId),
      Number(cortejoId)
    );

    return res.status(200).json(tramos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al listar tramos." });
  }
};

/* =====================================================
   EDITAR TRAMO (DMG)
===================================================== */
export const editarTramo = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });
    if (user.role !== "DMG")
      return res.status(403).json({ message: "Solo usuarios DMG pueden editar tramos." });

    const { cofradiaId, cortejoId, tramoId } = req.params;
    const { nombre, orden } = req.body;

    const tramo = await tramoService.editarTramo({
      cofradiaId: Number(cofradiaId),
      cortejoId: Number(cortejoId),
      tramoId: Number(tramoId),
      ...(nombre !== undefined && { nombre }),
      ...(orden !== undefined && { orden }),
    });

    return res.status(200).json({ message: "Tramo actualizado correctamente.", tramo });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "TRAMO_NOT_FOUND":
          return res.status(404).json({ message: "Tramo no encontrado." });
        case "TRAMO_NOT_BELONG_TO_COFRADIA":
          return res.status(400).json({ message: "El tramo no pertenece a la cofradía." });
        case "TRAMO_NOT_BELONG_TO_CORTEJO":
          return res.status(400).json({ message: "El tramo no pertenece al cortejo." });
        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "La cofradía está cerrada." });
      }
    }

    console.error(error);
    return res.status(500).json({ message: "Error interno al editar tramo." });
  }
};

/* =====================================================
   BORRAR TRAMO (DMG)
===================================================== */
export const borrarTramo = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });
    if (user.role !== "DMG")
      return res.status(403).json({ message: "Solo usuarios DMG pueden borrar tramos." });

    const { cofradiaId, cortejoId, tramoId } = req.params;

    await tramoService.borrarTramo(
      Number(cofradiaId),
      Number(cortejoId),
      Number(tramoId)
    );

    return res.status(200).json({ message: "Tramo eliminado correctamente." });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "TRAMO_NOT_FOUND":
          return res.status(404).json({ message: "Tramo no encontrado." });
        case "TRAMO_NOT_BELONG_TO_COFRADIA":
          return res.status(400).json({ message: "El tramo no pertenece a la cofradía." });
        case "TRAMO_NOT_BELONG_TO_CORTEJO":
          return res.status(400).json({ message: "El tramo no pertenece al cortejo." });
        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "La cofradía está cerrada." });
      }
    }

    console.error(error);
    return res.status(500).json({ message: "Error interno al borrar tramo." });
  }
};
