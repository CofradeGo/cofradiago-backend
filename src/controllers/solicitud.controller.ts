import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import type { User } from "../models/user.model.ts";
import {
  borrarSolicitud,
  cambiarEstadoSolicitud,
  contarSolicitudes,
  ESTADOS,
  listarSolicitudes,
  registrarSolicitud,
} from "../services/solicitud.service.ts";
import type { EstadoSolicitud } from "../services/solicitud.service.ts";
import type { ClaseElemento } from "../services/estructura.service.ts";

/**
 * Peticiones de sitio de una cofradía.
 *
 * Las tres clases comparten ruta con un parámetro (`puestos`, `insignias`
 * o `cargos`) porque hacen exactamente lo mismo: registrar, listar,
 * cambiar el estado y retirar. Separarlas en tres ficheros de
 *controllers sería el mismo código thrice.
 */

/** Las tres clases que se pueden pedir. */
const CLASES = {
  puestos: "puesto",
  insignias: "insignia",
  cargos: "cargo",
} as const satisfies Record<string, ClaseElemento>;

/**
 * Solo DMG registra peticiones y decide cuáles se aceptan.
 *
 * El control va aquí y no en la ruta porque es la misma regla en las
 * cuatro, y porque dejarla solo en `authMiddleware` la dejaría sin
 * comprobar: ese middleware solo verifica que haya token.
 */
const exigirDmg = (req: Request) => {
  const user = req.user as User | undefined;
  if (!user) {
    throw new AppError("ACCESS_DENIED", { message: "Usuario no autenticado." });
  }
  if (user.role !== "DMG") {
    throw new AppError("ACCESS_DENIED", {
      message: "Solo DMG puede registrar y decidir las peticiones de sitio.",
    });
  }
};

const claseDe = (params: unknown): ClaseElemento => {
  const nombre = (params as { clase?: string })?.clase;
  const clase = CLASES[nombre as keyof typeof CLASES];
  if (!clase) {
    throw new AppError("NO_VALID_FIELDS", { message: "Ese tipo de petición no existe." });
  }
  return clase;
};

/** Lee un número del cuerpo o de los parámetros de la ruta. */
const numero = (valor: unknown, nombre: string): number => {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError("NO_VALID_FIELDS", {
      message: `Falta ${nombre} o no es un número válido.`,
    });
  }
  return n;
};

/**
 * POST /api/v1/cofradias/:cofradiaId/cortejos/:cortejoId/solicitudes/:clase
 *
 * Registra que un hermano pide un puesto, una insignia o un cargo.
 * El cuerpo es `{ hermanoId, elementoId, notas? }`; el tramo va en la
 * ruta porque es la parte del encargo que fija dónde se pide.
 */
export const registrar = async (req: Request, res: Response) => {
  exigirDmg(req);
  const { cofradiaId, cortejoId } = req.params;
  const cuerpo = (req.body ?? {}) as Record<string, unknown>;

  const solicitud = await registrarSolicitud(claseDe(req.params), {
    cofradiaId: numero(cofradiaId, "la cofradía"),
    cortejoId: numero(cortejoId, "el cortejo"),
    tramoId: numero(cuerpo.tramoId, "el tramo"),
    hermanoId: numero(cuerpo.hermanoId, "el hermano"),
    elementoId: numero(cuerpo.elementoId, "el elemento"),
    notas: typeof cuerpo.notas === "string" ? cuerpo.notas.trim() || undefined : undefined,
  });

  return res.status(201).json({ message: "Petición registrada.", solicitud });
};

/**
 * GET /api/v1/cofradias/:cofradiaId/cortejos/:cortejoId/solicitudes
 *
 * Todas las peticiones del cortejo. Admite `?estado=PENDIENTE` y
 * `?hermanoId=12` para filtrar.
 */
export const listar = async (req: Request, res: Response) => {
  const { cofradiaId, cortejoId } = req.params;
  const consulta = req.query as Record<string, string>;

  const estado = consulta.estado;
  if (estado && !ESTADOS.includes(estado as EstadoSolicitud)) {
    throw new AppError("ESTADO_INVALIDO", {
      message: `El estado debe ser uno de: ${ESTADOS.join(", ")}.`,
    });
  }

  const [solicitudes, resumen] = await Promise.all([
    listarSolicitudes({
      cofradiaId: numero(cofradiaId, "la cofradía"),
      cortejoId: numero(cortejoId, "el cortejo"),
      estado: estado as EstadoSolicitud | undefined,
      hermanoId: consulta.hermanoId ? numero(consulta.hermanoId, "el hermano") : undefined,
    }),
    contarSolicitudes(numero(cofradiaId, "la cofradía")),
  ]);

  return res.status(200).json({ ...solicitudes, resumen });
};

/**
 * PATCH /api/v1/cofradias/:cofradiaId/cortejos/:cortejoId/solicitudes/:clase/:id
 *
 * Acepta, rechaza o devuelve a pendiente. El cuerpo es
 * `{ estado, notas? }`.
 */
export const cambiarEstado = async (req: Request, res: Response) => {
  exigirDmg(req);
  const { cofradiaId, cortejoId, id } = req.params;
  const cuerpo = (req.body ?? {}) as Record<string, unknown>;

  const solicitud = await cambiarEstadoSolicitud(claseDe(req.params), {
    cofradiaId: numero(cofradiaId, "la cofradía"),
    cortejoId: numero(cortejoId, "el cortejo"),
    id: numero(id, "la petición"),
    estado: String(cuerpo.estado ?? "") as EstadoSolicitud,
    notas: typeof cuerpo.notas === "string" ? cuerpo.notas.trim() || undefined : undefined,
  });

  const mensajes: Record<string, string> = {
    ACEPTADA: "Petición aceptada.",
    RECHAZADA: "Petición rechazada.",
    PENDIENTE: "Petición devuelta a pendiente.",
  };

  return res.status(200).json({
    message: mensajes[solicitud.estado] ?? "Petición actualizada.",
    solicitud,
  });
};

/**
 * DELETE /api/v1/cofradias/:cofradiaId/cortejos/:cortejoId/solicitudes/:clase/:id
 *
 * Retira la petición. Si estaba aceptada, su plaza vuelve a quedar libre.
 */
export const borrar = async (req: Request, res: Response) => {
  exigirDmg(req);
  const { cofradiaId, id } = req.params;

  const resultado = await borrarSolicitud(claseDe(req.params), {
    cofradiaId: numero(cofradiaId, "la cofradía"),
    id: numero(id, "la petición"),
  });

  return res.status(200).json(resultado);
};