import type { Request, Response } from "express";
import { insigniaService } from "../services/insignia.service.ts";
import type { User } from "../models/user.model.ts";

/* =====================================================
   TIPOS DE BODY
===================================================== */
interface CrearInsigniaBody {
  nombre: string;
  descripcion?: string;
  cortejoId?: number;
}

interface EditarInsigniaBody {
  nombre?: string;
  descripcion?: string;
  cortejoId?: number | null;
}

/* =====================================================
   CREAR INSIGNIA
===================================================== */
export const crearInsignia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user)
      return res.status(401).json({ message: "Usuario no autenticado." });

    if (user.role !== "DMG")
      return res
        .status(403)
        .json({ message: "Solo usuarios con rol DMG pueden crear insignias." });

    const { cofradiaId } = req.params;
    if (!cofradiaId)
      return res.status(400).json({ message: "cofradiaId es obligatorio." });

    const { nombre, descripcion, cortejoId } = req.body as CrearInsigniaBody;
    if (!nombre)
      return res.status(400).json({ message: "nombre es obligatorio." });

    const input = {
      cofradiaId: Number(cofradiaId),
      nombre,
      ...(descripcion !== undefined && { descripcion }),
      ...(cortejoId !== undefined && { cortejoId }),
    };

    const insignia = await insigniaService.crearInsignia(input);

    return res.status(201).json({
      message: `Insignia "${insignia.nombre}" creada correctamente.`,
      insignia,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada." });
        case "COFRADIA_CERRADA":
          return res.status(400).json({
            message: "No se pueden crear insignias en cofradías cerradas.",
          });
        case "CORTEJO_NOT_FOUND":
          return res.status(404).json({ message: "Cortejo no encontrado." });
        case "CORTEJO_NOT_BELONG_TO_COFRADIA":
          return res.status(400).json({
            message: "El cortejo no pertenece a esta cofradía.",
          });
        default:
          if (error.message.includes("Ya existe una insignia")) {
            return res.status(409).json({ message: error.message });
          }
      }
    }
    console.error("Error al crear insignia:", error);
    return res
      .status(500)
      .json({ message: "Error interno al crear la insignia." });
  }
};

/* =====================================================
   LISTAR INSIGNIAS
===================================================== */
export const listInsignias = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user)
      return res.status(401).json({ message: "Usuario no autenticado." });

    const { cofradiaId } = req.params;
    if (!cofradiaId)
      return res.status(400).json({ message: "cofradiaId es obligatorio." });

    const insignias = await insigniaService.listInsigniasByCofradia(
      Number(cofradiaId)
    );

    return res.status(200).json(insignias);
  } catch (error: unknown) {
    console.error("Error al listar insignias:", error);
    return res
      .status(500)
      .json({ message: "Error interno al listar las insignias." });
  }
};

/* =====================================================
   EDITAR INSIGNIA
===================================================== */
export const editarInsignia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user)
      return res.status(401).json({ message: "Usuario no autenticado." });

    if (user.role !== "DMG")
      return res.status(403).json({
        message: "Solo usuarios con rol DMG pueden editar insignias.",
      });

    const { cofradiaId, insigniaId } = req.params;
    if (!cofradiaId || !insigniaId)
      return res.status(400).json({
        message: "cofradiaId e insigniaId son obligatorios.",
      });

    const { nombre, descripcion, cortejoId } =
      req.body as EditarInsigniaBody;

    const input = {
      cofradiaId: Number(cofradiaId),
      insigniaId: Number(insigniaId),
      ...(nombre !== undefined && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
      ...(cortejoId !== undefined && { cortejoId }),
    };

    const insignia = await insigniaService.editarInsignia(input);

    return res.status(200).json({
      message: "Insignia actualizada correctamente.",
      insignia,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "INSIGNIA_NOT_FOUND":
          return res.status(404).json({ message: "Insignia no encontrada." });
        case "INSIGNIA_NOT_BELONG_TO_COFRADIA":
          return res.status(400).json({
            message: "La insignia no pertenece a esta cofradía.",
          });
        case "COFRADIA_CERRADA":
          return res.status(400).json({
            message: "No se pueden editar insignias en cofradías cerradas.",
          });
      }
    }
    console.error("Error al editar insignia:", error);
    return res
      .status(500)
      .json({ message: "Error interno al editar la insignia." });
  }
};

/* =====================================================
   BORRAR INSIGNIA
===================================================== */
export const borrarInsignia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user)
      return res.status(401).json({ message: "Usuario no autenticado." });

    if (user.role !== "DMG")
      return res.status(403).json({
        message: "Solo usuarios con rol DMG pueden borrar insignias.",
      });

    const { cofradiaId, insigniaId } = req.params;
    if (!cofradiaId || !insigniaId)
      return res.status(400).json({
        message: "cofradiaId e insigniaId son obligatorios.",
      });

    await insigniaService.borrarInsignia(
      Number(cofradiaId),
      Number(insigniaId)
    );

    return res.status(200).json({
      message: "Insignia eliminada correctamente.",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "INSIGNIA_NOT_FOUND":
          return res.status(404).json({ message: "Insignia no encontrada." });
        case "INSIGNIA_NOT_BELONG_TO_COFRADIA":
          return res.status(400).json({
            message: "La insignia no pertenece a esta cofradía.",
          });
        case "COFRADIA_CERRADA":
          return res.status(400).json({
            message: "No se pueden borrar insignias en cofradías cerradas.",
          });
      }
    }
    console.error("Error al borrar insignia:", error);
    return res
      .status(500)
      .json({ message: "Error interno al borrar la insignia." });
  }
};
