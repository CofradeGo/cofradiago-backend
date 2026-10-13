import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { tramoService } from "../services/tramos.service.ts";
import {
  asignarATramo,
} from "../services/estructura.service.ts";
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

/* =====================================================
   REORDENAR TRAMOS (DMG)
===================================================== */
export const reordenarTramos = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user) throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });
  if (user.role !== "DMG") throw new AppError("ACCESS_DENIED", {
      message: "Solo DMG puede reordenar los tramos.",
    });

  const { cofradiaId, cortejoId } = req.params;
  if (!cofradiaId || !cortejoId) throw new AppError("NO_VALID_FIELDS", {
      message: "Parámetros cofradiaId y cortejoId obligatorios.",
    });

  const { ids } = req.body as { ids?: number[] };

  const tramos = await tramoService.reordenarTramos(
    Number(cofradiaId),
    Number(cortejoId),
    ids ?? [],
  );
  return res.status(200).json({
    message: "Orden de los tramos actualizado.",
    tramos,
  });
};

/* =====================================================
    ASIGNAR INSIGNIAS, CARGOS Y PUESTOS A UN TRAMO (DMG)
    ===================================================== */

/**
 * Lee la lista de elementos con sus plazas.
 *
 * Las plazas no vienen si se omiten, en cuyo caso es una: un tramo con
 * un solo "Diputado de Cruz" no necesita decir que es una. Un NaN aquí
 * lo rechaza la validación del servicio con un mensaje claro, mejor que
 * guardarlo tal cual.
 */
const cuerpoDeElementos = (req: Request, clave: string) => {
  const valor = (req.body as Record<string, unknown>)?.[clave];
  if (!Array.isArray(valor)) return [];

  return valor
    .filter((e): e is { id: number; plazas?: number } =>
      !!e && typeof (e as { id?: unknown }).id === "number",
    )
    .map((e) => ({
      id: Number(e.id),
      plazas: e.plazas === undefined ? 1 : Number(e.plazas),
    }));
};

/** Solo DMG cambia la estructura de la procesión. */
const exigirDmg = (req: Request) => {
  const user = req.user as User | undefined;
  if (!user) {
    throw new AppError("ACCESS_DENIED", { message: "Usuario no autenticado." });
  }
  if (user.role !== "DMG") {
    throw new AppError("ACCESS_DENIED", {
      message: "Solo DMG puede modificar la estructura de la procesión.",
    });
  }
};

const idsDeRuta = (req: Request) => {
  const { cofradiaId, cortejoId, tramoId } = req.params;
  if (!cofradiaId || !cortejoId || !tramoId) throw new AppError("NO_VALID_FIELDS");
  return {
    cofradiaId: Number(cofradiaId),
    cortejoId: Number(cortejoId),
    tramoId: Number(tramoId),
  };
};

/**
 * Los tres endpoints son el mismo con otro nombre: qué insignias, qué
 * cargos o qué puestos van en el tramo, y cuántas plazas de cada uno.
 * Se manda siempre la lista completa de lo que debe quedar.
 */
const endpointDeAsignacion =
  (clase: "insignia" | "cargo" | "puesto", plural: string) =>
  async (req: Request, res: Response) => {
    exigirDmg(req);
    const ids = idsDeRuta(req);

    const elementos = await asignarATramo(
      clase,
      ids.cofradiaId,
      ids.cortejoId,
      ids.tramoId,
      cuerpoDeElementos(req, `${clase}s`),
    );

    const clave = clase === "puesto" ? "puestos" : `${clase}s`;
    return res.status(200).json({
      message: `${plural.charAt(0).toUpperCase()}${plural.slice(1)} del tramo actualizadas.`,
      [clave]: elementos,
    });
  };

export const asignarInsignias = endpointDeAsignacion("insignia", "insignias");
export const asignarCargos = endpointDeAsignacion("cargo", "cargos");
export const asignarPuestos = endpointDeAsignacion("puesto", "puestos");
