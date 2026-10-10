import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { insigniaElementoService } from "../services/insigniaElemento.service.ts";
import type { User } from "../models/user.model.ts";

/* =====================================================
   TIPOS DE BODY
===================================================== */
interface CrearElementoBody {
  tipo: string;
  cantidad?: number;
}

interface EditarElementoBody {
  tipo?: string;
  cantidad?: number;
}

/* =====================================================
   CREAR ELEMENTO DE INSIGNIA
===================================================== */
export const crearElemento = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED", {
      message: "Solo DMG puede crear elementos.",
    });

  const { insigniaId } = req.params;
  const { tipo, cantidad } = req.body as CrearElementoBody;

  if (!insigniaId || !tipo) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Parámetros obligatorios: insigniaId y tipo.",
    });
  }

  // Garantizar que cantidad siempre sea un número
  const elemento = await insigniaElementoService.crearElemento({
    insigniaId: Number(insigniaId),
    tipo,
    cantidad: cantidad ?? 1, // si no viene, por defecto 1
  });

  return res.status(201).json({
    message: `Elemento "${elemento.tipo}" creado correctamente.`,
    elemento,
  });
  
};

/* =====================================================
   LISTAR ELEMENTOS DE UNA INSIGNIA
===================================================== */
export const listElementos = async (req: Request, res: Response) => {
  const { insigniaId } = req.params;
  if (!insigniaId) throw new AppError("NO_VALID_FIELDS", {
      message: "insigniaId obligatorio.",
    });

  const elementos = await insigniaElementoService.listElementosByInsignia(Number(insigniaId));
  return res.status(200).json(elementos);
  
};

/* =====================================================
   EDITAR ELEMENTO DE INSIGNIA
===================================================== */
export const editarElemento = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED", {
      message: "Solo DMG puede editar elementos.",
    });

  const { elementoId } = req.params;
  const { tipo, cantidad } = req.body as EditarElementoBody;

  if (!elementoId) throw new AppError("NO_VALID_FIELDS", {
      message: "elementoId obligatorio.",
    });

  const elemento = await insigniaElementoService.editarElemento({
    elementoId: Number(elementoId),
    ...(tipo && { tipo }),
    ...(cantidad !== undefined && { cantidad }), // solo incluir si viene
  });

  return res.status(200).json({
    message: "Elemento actualizado correctamente.",
    elemento,
  });
  
};

/* =====================================================
   BORRAR ELEMENTO DE INSIGNIA
===================================================== */
export const borrarElemento = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED", {
      message: "Solo DMG puede borrar elementos.",
    });

  const { elementoId } = req.params;
  if (!elementoId) throw new AppError("NO_VALID_FIELDS", {
      message: "elementoId obligatorio.",
    });

  await insigniaElementoService.borrarElemento(Number(elementoId));

  return res.status(200).json({ message: "Elemento eliminado correctamente." });
  
};
