import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import {
  cofradiaService,
  type ListCofradiasOptions,
  type ActualizarCofradiaInput,
} from "../services/cofradia.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias
 */
export const crearCofradia = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user)
    return res
      .status(401)
      .json({ message: "Usuario no autenticado. Por favor, inicia sesión." });
  if (user.role !== "DMG")
    return res
      .status(403)
      .json({ message: "Solo usuarios DMG pueden crear cofradías." });

  const { nombre, anio, tipo } = req.body;
  if (!nombre || !anio || !tipo)
    throw new AppError("NO_VALID_FIELDS", {
      message: "Datos incompletos",
    });

  const cofradia = await cofradiaService.crearCofradia({
    hermandadId: user.hermandadId,
    nombre,
    anio,
    tipo,
  });

  return res
    .status(201)
    .json({
      message: `Cofradía "${cofradia.nombre}" creada correctamente`,
      cofradia,
    });
  
};

/**
 * GET /api/v1/cofradias
 */
export const listCofradias = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) {
    throw new AppError("ACCESS_DENIED");
  }

  const orderQuery: "asc" | "desc" =
    (req.query.order as "asc" | "desc") || "desc";
  const estadoQuery: "ABIERTA" | "CERRADA" | undefined = req.query.estado as
    | "ABIERTA"
    | "CERRADA"
    | undefined;

  const options: ListCofradiasOptions = {
    hermandadId: user.hermandadId,
    order: orderQuery,
    ...(estadoQuery !== undefined && { estado: estadoQuery }),
  };

  const cofradias = await cofradiaService.listCofradias(options);
  return res.status(200).json(cofradias);
};

export const actualizarCofradia = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED");
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED");

  const { cofradiaId } = req.params;
  const data: ActualizarCofradiaInput = req.body;

  if (!cofradiaId) throw new AppError("COFRADIA_NOT_FOUND");

  // ✅ Filtramos solo campos válidos
  const validData: ActualizarCofradiaInput = {};
  if (data.nombre && data.nombre.trim() !== "")
    validData.nombre = data.nombre.trim();
  if (data.anio !== undefined && data.anio !== null)
    validData.anio = data.anio;
  if (data.tipo && data.tipo.trim() !== "") validData.tipo = data.tipo.trim();

  if (Object.keys(validData).length === 0) {
    throw new AppError("NO_FIELDS_TO_UPDATE");
  }

  const cofradia = await cofradiaService.actualizarCofradia(
    Number(cofradiaId),
    validData
  );
  return res
    .status(200)
    .json({ message: "Cofradía actualizada correctamente", cofradia });
};

// POST /api/v1/cofradias/:id/clone
export const clonarCofradia = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED");
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED");

  const cofradiaId = Number(req.params.cofradiaId);
  const { anioNuevo } = req.body;

  if (!anioNuevo) throw new AppError("NO_VALID_FIELDS");

  // Llamada al service que ya clona con todas las relaciones
  const nuevaCofradia = await cofradiaService.clonarCofradia({
    cofradiaId,
    anioNuevo: Number(anioNuevo),
  });

  return res.status(201).json({
    message: `Cofradía clonada correctamente para el año ${anioNuevo}`,
    cofradia: nuevaCofradia,
  });
};

/**
 * DELETE /api/v1/cofradias/:cofradiaId
 */
export const borrarCofradia = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED");
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED");

  const cofradiaId = Number(req.params.cofradiaId);
  if (isNaN(cofradiaId)) throw new AppError("NO_VALID_FIELDS");

  const result = await cofradiaService.borrarCofradia(cofradiaId);
  return res.status(200).json(result);
};

/**
 * POST /api/v1/cofradias/full
 */
export const crearFullCofradia = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user)
    return res
      .status(401)
      .json({ message: "Usuario no autenticado. Por favor, inicia sesión." });
  if (user.role !== "DMG")
    return res
      .status(403)
      .json({ message: "Solo usuarios DMG pueden crear cofradías." });

  const payload = req.body;

  // Validación mínima: nombre, año y tipo
  if (!payload.nombre || !payload.anio || !payload.tipo) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Datos incompletos: nombre, año y tipo son obligatorios",
    });
  }

  // Llamada al service
  const cofradia = await cofradiaService.createFullCofradia({
    hermandadId: user.hermandadId,
    nombre: payload.nombre,
    anio: payload.anio,
    tipo: payload.tipo,
    cortejos: payload.cortejos || [],
    cargos: payload.cargos || [],
    puestos: payload.puestos || [],
    insignias: payload.insignias || [],
  });

  return res.status(201).json({
    message: `Cofradía "${cofradia.nombre}" creada correctamente con todos sus elementos`,
    cofradia,
  });
  
};

/**
 * PATCH /api/v1/cofradias/:cofradiaId/estado
 * Abrir o cerrar una cofradía (solo DMG).
 */
export const cambiarEstadoCofradia = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED");
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED");

  const { cofradiaId } = req.params;
  if (!cofradiaId) throw new AppError("COFRADIA_NOT_FOUND");

  const { estado } = req.body as { estado?: string };

  if (estado !== "ABIERTA" && estado !== "CERRADA") {
    throw new AppError("ESTADO_INVALIDO");
  }

  const cofradia = await cofradiaService.cambiarEstado(Number(cofradiaId), estado);

  const cerrada = estado === "CERRADA";
  return res.status(200).json({
    message: cerrada
      ? `Cofradía ${cofradia.anio} cerrada. Ya no admite cambios.`
      : `Cofradía ${cofradia.anio} reabierta.`,
    cofradia,
  });
};
