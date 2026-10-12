import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { insigniaService } from "../services/insignia.service.ts";
import type { User } from "../models/user.model.ts";

/* =====================================================
   TIPOS DE BODY
===================================================== */
interface CrearInsigniaBody {
  nombre: string;
  descripcion?: string;
  /** `null` o ausente: se crea sin asignar a ningún cortejo. */
  cortejoId?: number | null;
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
  const user = req.user as User | undefined;
  if (!user)
    throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });

  if (user.role !== "DMG")
    return res
      .status(403)
      .json({ message: "Solo usuarios con rol DMG pueden crear insignias." });

  const { cofradiaId } = req.params;
  if (!cofradiaId)
    throw new AppError("NO_VALID_FIELDS", {
      message: "cofradiaId es obligatorio.",
    });

  const { nombre, descripcion, cortejoId } = req.body as CrearInsigniaBody;
  if (!nombre)
    throw new AppError("NO_VALID_FIELDS", {
      message: "nombre es obligatorio.",
    });

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
  
};

/* =====================================================
   LISTAR INSIGNIAS
===================================================== */
export const listInsignias = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED");

  const { cofradiaId } = req.params;
  if (!cofradiaId) throw new AppError("NO_VALID_FIELDS");

  const insignias = await insigniaService.listInsigniasByCofradia(
    Number(cofradiaId)
  );

  return res.status(200).json(insignias);
};

/* =====================================================
   EDITAR INSIGNIA
===================================================== */
export const editarInsignia = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED");
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED");

  const { cofradiaId, insigniaId } = req.params;
  if (!cofradiaId || !insigniaId) throw new AppError("NO_VALID_FIELDS");

  const { nombre, descripcion, cortejoId } = req.body as EditarInsigniaBody;

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
};

/* =====================================================
   BORRAR INSIGNIA
===================================================== */
export const borrarInsignia = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED");
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED");

  const { cofradiaId, insigniaId } = req.params;
  if (!cofradiaId || !insigniaId) throw new AppError("NO_VALID_FIELDS");

  await insigniaService.borrarInsignia(Number(cofradiaId), Number(insigniaId));

  return res.status(200).json({
    message: "Insignia eliminada correctamente.",
  });
};
