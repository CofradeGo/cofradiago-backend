import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { cargoService } from "../services/cargo.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias/:cofradiaId/cargos
 * Crear un nuevo cargo en una cofradía
 */
export const crearCargo = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;

  if (!user) {
    throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado. Por favor, inicia sesión.",
    });
  }

  if (user.role !== "DMG") {
    throw new AppError("ACCESS_DENIED", {
      message: "Acceso denegado. Solo usuarios con rol DMG pueden crear cargos.",
    });
  }

  const { cofradiaId } = req.params;
  const { nombre } = req.body;

  if (!cofradiaId || !nombre) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Datos incompletos: se requiere cofradía y nombre del cargo.",
    });
  }

  const cargo = await cargoService.crearCargo({
    cofradiaId: Number(cofradiaId),
    nombre,
  });

  return res.status(201).json({
    message: `Cargo "${cargo.nombre}" creado correctamente en la cofradía.`,
    cargo,
  });
  
};

/**
 * GET /api/v1/cofradias/:cofradiaId/cargos
 * Listar cargos de una cofradía
 */
export const listCargos = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;

  if (!user) {
    throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado. Por favor, inicia sesión.",
    });
  }

  const { cofradiaId } = req.params;

  if (!cofradiaId) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Parámetro cofradiaId obligatorio",
    });
  }

  const cargos = await cargoService.listCargosByCofradia(Number(cofradiaId));

  return res.status(200).json(cargos);
  
};

/**
 * PUT /api/v1/cofradias/:cofradiaId/cargos/:cargoId
 * Editar un cargo
 */
export const editarCargo = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  const { cargoId } = req.params;
  const { nombre } = req.body;

  if (!user) {
    throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado. Por favor, inicia sesión.",
    });
  }

  if (user.role !== "DMG") {
    throw new AppError("ACCESS_DENIED", {
      message: "Acceso denegado. Solo usuarios con rol DMG pueden editar cargos.",
    });
  }

  if (!cargoId || !nombre) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Datos incompletos: se requiere cargo y nombre.",
    });
  }

  const cargo = await cargoService.editarCargo({
    cargoId: Number(cargoId),
    nombre,
  });

  return res.status(200).json({
    message: `Cargo "${cargo.nombre}" actualizado correctamente.`,
    cargo,
  });
  
};

/**
 * DELETE /api/v1/cofradias/:cofradiaId/cargos/:cargoId
 * Borrar un cargo
 */
export const borrarCargo = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  const { cargoId } = req.params;

  if (!user) {
    throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado. Por favor, inicia sesión.",
    });
  }

  if (user.role !== "DMG") {
    throw new AppError("ACCESS_DENIED", {
      message: "Acceso denegado. Solo usuarios con rol DMG pueden borrar cargos.",
    });
  }

  if (!cargoId) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Parámetro cargoId obligatorio.",
    });
  }

  await cargoService.borrarCargo(Number(cargoId));

  return res.status(200).json({
    message: "Cargo eliminado correctamente.",
  });
  
};
