import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { puestoService } from "../services/puesto.service.ts";
import type { User } from "../models/user.model.ts";

/* =====================================================
   TIPOS DE BODY
===================================================== */

interface CrearPuestoBody {
  nombre: string;
  codigo?: string;
}

interface EditarPuestoBody {
  nombre?: string;
  codigo?: string;
}

/* =====================================================
   CREAR PUESTO
===================================================== */

/**
 * POST /api/v1/cofradias/:cofradiaId/puestos
 */
export const crearPuesto = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) {
    throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado. Por favor, inicia sesión.",
    });
  }

  if (user.role !== "DMG") {
    throw new AppError("ACCESS_DENIED", {
      message: "Acceso denegado. Solo usuarios con rol DMG pueden crear puestos.",
    });
  }

  const { cofradiaId } = req.params;
  const { nombre, codigo } = req.body as CrearPuestoBody;

  if (!cofradiaId || !nombre) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Datos incompletos: se requiere cofradiaId y nombre del puesto.",
    });
  }

  // 🔹 Construcción segura del input
  const input: {
    cofradiaId: number;
    nombre: string;
    codigo?: string;
  } = {
    cofradiaId: Number(cofradiaId),
    nombre,
  };

  if (codigo !== undefined) {
    input.codigo = codigo;
  }

  const puesto = await puestoService.crearPuesto(input);

  return res.status(201).json({
    message: `Puesto "${puesto.nombre}" creado correctamente en la cofradía.`,
    puesto,
  });
  
};

/* =====================================================
   LISTAR PUESTOS
===================================================== */

/**
 * GET /api/v1/cofradias/:cofradiaId/puestos
 */
export const listPuestos = async (req: Request, res: Response) => {
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

  const puestos = await puestoService.listPuestosByCofradia(
    Number(cofradiaId)
  );

  return res.status(200).json(puestos);
  
};

/* =====================================================
   EDITAR PUESTO
===================================================== */

/**
 * PUT /api/v1/cofradias/:cofradiaId/puestos/:puestoId
 */
export const editarPuesto = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) {
    throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  }

  if (user.role !== "DMG") {
    throw new AppError("ACCESS_DENIED", {
      message: "Solo usuarios DMG pueden editar puestos.",
    });
  }

  const { cofradiaId, puestoId } = req.params;
  const { nombre, codigo } = req.body as EditarPuestoBody;

  if (!cofradiaId || !puestoId) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "cofradiaId y puestoId son obligatorios.",
    });
  }

  // 🔹 Construcción segura del input
  const data: {
    nombre?: string;
    codigo?: string;
  } = {};

  if (nombre !== undefined) {
    data.nombre = nombre;
  }

  if (codigo !== undefined) {
    data.codigo = codigo;
  }

  const puesto = await puestoService.editarPuesto(
    Number(puestoId),
    data
  );

  return res.status(200).json({
    message: "Puesto actualizado correctamente.",
    puesto,
  });
  
};

/* =====================================================
   BORRAR PUESTO
===================================================== */

/**
 * DELETE /api/v1/cofradias/:cofradiaId/puestos/:puestoId
 */
export const borrarPuesto = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) {
    throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  }

  if (user.role !== "DMG") {
    throw new AppError("ACCESS_DENIED", {
      message: "Solo usuarios DMG pueden borrar puestos.",
    });
  }

  const { cofradiaId, puestoId } = req.params;

  if (!cofradiaId || !puestoId) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "cofradiaId y puestoId son obligatorios.",
    });
  }

  await puestoService.borrarPuesto(Number(puestoId));

  return res.status(200).json({
    message: "Puesto eliminado correctamente.",
  });
  
};
