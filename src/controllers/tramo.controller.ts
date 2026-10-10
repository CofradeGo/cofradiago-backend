import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { tramoService } from "../services/tramos.service.ts";
import type { User } from "../models/user.model.ts";

/* =====================================================
   CREAR TRAMO (DMG)
===================================================== */
export const crearTramo = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG")
    throw new AppError("ACCESS_DENIED", {
      message: "Solo usuarios DMG pueden crear tramos.",
    });

  const { cofradiaId, cortejoId } = req.params;
  const { nombre, orden } = req.body;

  if (!cofradiaId || !cortejoId || !nombre) {
    throw new AppError("NO_VALID_FIELDS", {
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
  
};

/* =====================================================
   LISTAR TRAMOS (DMG | AUXILIAR)
===================================================== */
export const listTramos = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });

  if (!["DMG", "AUXILIAR"].includes(user.role)) {
    throw new AppError("ACCESS_DENIED", {
      message: "No tienes permisos para listar tramos.",
    });
  }

  const { cofradiaId, cortejoId } = req.params;

  const tramos = await tramoService.listarTramos(
    Number(cofradiaId),
    Number(cortejoId)
  );

  return res.status(200).json(tramos);
  
};

/* =====================================================
   EDITAR TRAMO (DMG)
===================================================== */
export const editarTramo = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG")
    throw new AppError("ACCESS_DENIED", {
      message: "Solo usuarios DMG pueden editar tramos.",
    });

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
  
};

/* =====================================================
   BORRAR TRAMO (DMG)
===================================================== */
export const borrarTramo = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG")
    throw new AppError("ACCESS_DENIED", {
      message: "Solo usuarios DMG pueden borrar tramos.",
    });

  const { cofradiaId, cortejoId, tramoId } = req.params;

  await tramoService.borrarTramo(
    Number(cofradiaId),
    Number(cortejoId),
    Number(tramoId)
  );

  return res.status(200).json({ message: "Tramo eliminado correctamente." });
  
};
