import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { cortejoService } from "../services/cortejo.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias/:cofradiaId/cortejos
 */
export const crearCortejo = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  const { cofradiaId } = req.params;
  const { nombre, orden } = req.body;

  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED", {
      message: "Solo DMG puede crear cortejos.",
    });
  if (!cofradiaId || !nombre || orden === undefined)
    throw new AppError("NO_VALID_FIELDS", {
      message: "Datos incompletos.",
    });

  const cortejo = await cortejoService.crearCortejo({
    cofradiaId: Number(cofradiaId),
    nombre,
    orden: Number(orden),
  });

  return res.status(201).json({ message: `Cortejo "${cortejo.nombre}" creado.`, cortejo });
  
};

/**
 * GET /api/v1/cofradias/:cofradiaId/cortejos
 */
export const listCortejosByCofradia = async (req: Request, res: Response) => {
  const { cofradiaId } = req.params;
  if (!cofradiaId) throw new AppError("NO_VALID_FIELDS", {
      message: "Parámetro cofradiaId obligatorio.",
    });

  const cortejos = await cortejoService.listCortejosByCofradia(Number(cofradiaId));
  return res.status(200).json(cortejos);
  
};

/**
 * PUT /api/v1/cortejos/:cortejoId
 * Editar un cortejo
 */
export const editarCortejo = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  const { cortejoId } = req.params;
  const { nombre, orden } = req.body;

  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED", {
      message: "Solo DMG puede editar cortejos.",
    });
  if (!cortejoId) throw new AppError("NO_VALID_FIELDS", {
      message: "Parámetro cortejoId obligatorio.",
    });

  const cortejo = await cortejoService.editarCortejo(Number(cortejoId), { nombre, orden });
  return res.status(200).json({ message: `Cortejo "${cortejo.nombre}" actualizado.`, cortejo });
  
};

/**
 * DELETE /api/v1/cortejos/:cortejoId
 * Borrar un cortejo
 */
export const borrarCortejo = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  const { cortejoId } = req.params;

  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED", {
      message: "Solo DMG puede borrar cortejos.",
    });
  if (!cortejoId) throw new AppError("NO_VALID_FIELDS", {
      message: "Parámetro cortejoId obligatorio.",
    });

  const cortejo = await cortejoService.borrarCortejo(Number(cortejoId));
  return res.status(200).json({ message: `Cortejo "${cortejo.nombre}" eliminado.`, cortejo });
  
};
