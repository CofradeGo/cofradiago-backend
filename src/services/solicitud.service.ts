import { prisma } from "../config/prismaClient.ts";
import { AppError } from "../errors/AppError.ts";
import { obtenerCofradiaEditable } from "./guards/cofradia.guards.ts";
import { asegurarTramoPertenece, plazasLibres } from "./estructura.service.ts";
import type { ClaseElemento } from "./estructura.service.ts";

/**
 * Peticiones de sitio: lo que un hermano pide y en qué está.
 *
 * Hay tres clases —puesto, insignia y cargo— y se tratan igual porque
 * significan lo mismo: "quiero estar aquí, en este tramo, haciendo
 * esto". Un hermano puede pedir las tres a la vez, pero solo una de
 * cada clase por cofradía.
 *
 * El aforo se comprueba al aceptar, no al pedir. Varios hermanos
 * pidiendo la misma Cruz de Guía es lo normal: luego la junta elige, y
 * bloquear en el momento de pedir dejaría a la primera persona sin
 * elegir.
 */

export const ESTADOS = ["PENDIENTE", "ACEPTADA", "RECHAZADA"] as const;
export type EstadoSolicitud = (typeof ESTADOS)[number];

/** Lo que se devuelve al cliente, con el elemento ya resuelto. */
export interface Solicitud {
  id: number;
  clase: ClaseElemento;
  elementoId: number;
  elementoNombre: string;
  hermanoId: number;
  hermano: string;
  tramoId: number;
  tramoNombre: string;
  estado: EstadoSolicitud;
  notas: string | null;
}

/** Fila tal como la devuelve Prisma, con sus relaciones incluidas. */
type Fila = {
  id: number;
  hermanoId: number;
  tramoId: number;
  cofradiaId: number;
  estado: EstadoSolicitud;
  notas: string | null;
  hermano: { nombre: string; apellidos: string };
  tramo: { nombre: string };
  puesto: { id: number; nombre: string } | null;
  insignia: { id: number; nombre: string } | null;
  cargo: { id: number; nombre: string } | null;
};

/** Las tres clases se leen igual salvo por el campo que las une a su elemento. */
const CLASES = {
  puesto: { clave: "puestoId", etiqueta: "el puesto" },
  insignia: { clave: "insigniaId", etiqueta: "la insignia" },
  cargo: { clave: "cargoId", etiqueta: "el cargo" },
} as const satisfies Record<ClaseElemento, { clave: string; etiqueta: string }>;

/** Lo único que cambia entre las tres tablas de Prisma. */
type Delegado = {
  create(args: unknown): Promise<Fila>;
  findUnique(args: unknown): Promise<Fila | null>;
  findMany(args: unknown): Promise<Fila[]>;
  count(args: unknown): Promise<number>;
  update(args: unknown): Promise<Fila>;
  delete(args: unknown): Promise<Fila>;
};

/**
 * Las tres tablas son idénticas salvo el nombre de la columna que las
 * une a su elemento, y Prisma no tiene forma de decir "esto vale para
 * cualquiera de las tres". El `as` está aquí y no repartido por el
 * resto del fichero a propósito: es el único punto donde se pierde el
 * tipado, y está en un sitio solo para poder revisarlo.
 */
const tabla = (clase: ClaseElemento): Delegado =>
  (
    {
      puesto: prisma.puestoHermano,
      insignia: prisma.insigniaHermano,
      cargo: prisma.cargoHermano,
    })[clase] as unknown as Delegado;

/**
 * Lo que se trae de cada fila. El elemento se incluye con el nombre de
 * su clase: `PuestoHermano` no tiene campo `insignia`, y pedírselo
 *Prisma falla aunque no se use.
 */
const incluir = (clase: ClaseElemento) => ({
  hermano: { select: { nombre: true, apellidos: true } },
  tramo: { select: { nombre: true } },
  [clase]: { select: { id: true, nombre: true } },
});

type Filtro = {
  cofradiaId: number;
  estado?: EstadoSolicitud | undefined;
  hermanoId?: number | undefined;
  elementoId?: number | undefined;
  tramos?: number[] | undefined;
};

const where = (clase: ClaseElemento, f: Filtro) => {
  const { clave } = CLASES[clase];
  return {
    cofradiaId: f.cofradiaId,
    ...(f.estado ? { estado: f.estado } : {}),
    ...(f.hermanoId ? { hermanoId: f.hermanoId } : {}),
    ...(f.elementoId ? { [clave]: f.elementoId } : {}),
    ...(f.tramos ? { tramoId: { in: f.tramos } } : {}),
  };
};

/**
 * La insignia, el cargo o el puesto de la fila, según la clase. La
 * columna se llama igual que la clase salvo en `puesto`, que así se
 * llama la tabla.
 */
const elementoDe = (clase: ClaseElemento, f: Fila): { id: number; nombre: string } =>
  f[clase === "puesto" ? "puesto" : clase]!;

/** Normaliza la fila al mismo formato en las tres clases. */
const normalizar = (clase: ClaseElemento, f: Fila): Solicitud => {
  const elemento = elementoDe(clase, f);
  return {
    id: f.id,
    clase,
    elementoId: elemento.id,
    elementoNombre: elemento.nombre,
    hermanoId: f.hermanoId,
    hermano: `${f.hermano.nombre} ${f.hermano.apellidos}`,
    tramoId: f.tramoId,
    tramoNombre: f.tramo.nombre,
    estado: f.estado,
    notas: f.notas,
  };
};

/**
 * Todas las peticiones de un tramo van colgadas de él, así que filtrar
 * por cortejo es filtrar por sus tramos. Se resuelven antes porque
 * Prisma no anida filtros de relación sin ensuciar la consulta.
 */
const tramosDelCortejo = async (cortejoId?: number) => {
  if (!cortejoId) return undefined;
  const tramos = await prisma.tramo.findMany({
    where: { cortejoId },
    select: { id: true },
  });
  return tramos.map((t) => t.id);
};

/**
 * Registra que un hermano pide algo.
 *
 * Se comprueba que el elemento esté en el tramo: pedir la Cruz de Guía
 * en un tramo donde no sale sería una petición que no se puede
 * atender, y es mejor enterarse al registrarla que al aceptarla.
 */
export const registrarSolicitud = async (
  clase: ClaseElemento,
  datos: {
    cofradiaId: number;
    cortejoId: number;
    tramoId: number;
    hermanoId: number;
    elementoId: number;
    notas?: string | undefined;
  },
) => {
  const { cofradiaId, cortejoId, tramoId, hermanoId, elementoId } = datos;
  await obtenerCofradiaEditable(cofradiaId);
  await asegurarTramoPertenece(cofradiaId, cortejoId, tramoId);
  await asegurarHermanoEsDeLaCofradia(cofradiaId, hermanoId);

  const { plazas } = await plazasLibres(clase, tramoId, elementoId);
  if (plazas === 0) {
    throw new AppError("TRAMO_SIN_ESE_ELEMENTO", {
      message: `${CLASES[clase].etiqueta.charAt(0).toUpperCase()}${CLASES[clase].etiqueta.slice(1)} no sale en ese tramo.`,
    });
  }

  try {
    const creada = await tabla(clase).create({
      data: {
        hermanoId,
        tramoId,
        cofradiaId,
        notas: datos.notas ?? null,
        [CLASES[clase].clave]: elementoId,
      },
      include: incluir(clase),
    });
    return normalizar(clase, creada);
  } catch (error) {
    // El índice único es la garantía de que nadie pide dos veces lo
    // mismo. El aviso de Postgres llega sin traducir, así que se
    // sustituye por uno que diga qué ha pasado.
    if (esViolacionDeUnico(error)) {
      throw new AppError("YA_SOLO_HAY_UNO", {
        message: "Este hermano ya tiene una petición de ese tipo en esta cofradía.",
      });
    }
    throw error;
  }
};

/** Acepta, rechaza o devuelve a pendiente una petición. */
export const cambiarEstadoSolicitud = async (
  clase: ClaseElemento,
  datos: {
    cofradiaId: number;
    cortejoId: number;
    id: number;
    estado: EstadoSolicitud;
    notas?: string | undefined;
  },
) => {
  const { cofradiaId, cortejoId, id, estado } = datos;
  await obtenerCofradiaEditable(cofradiaId);

  if (!ESTADOS.includes(estado)) {
    throw new AppError("ESTADO_INVALIDO", {
      message: `El estado debe ser uno de: ${ESTADOS.join(", ")}.`,
    });
  }

  const previa = await tabla(clase).findUnique({ where: { id }, include: incluir(clase) });
  if (!previa || previa.cofradiaId !== cofradiaId) {
    throw new AppError("ELEMENTO_NOT_FOUND", {
      message: "La petición no existe en esta cofradía.",
    });
  }
  await asegurarTramoPertenece(cofradiaId, cortejoId, previa.tramoId);

  // Solo al pasar a aceptada importa que haya sitio. Rechazar una
  // petición sin plazas libres debe poder hacerse siempre.
  if (estado === "ACEPTADA") {
    const { libres } = await plazasLibres(
      clase,
      previa.tramoId,
      elementoDe(clase, previa).id,
      id,
    );
    if (libres <= 0) {
      throw new AppError("SIN_PLAZAS_LIBRES", {
        message: `No quedan plazas libres de ${CLASES[clase].etiqueta} en ese tramo. Sube las plazas en la estructura del cortejo si quieres admitir a más gente.`,
      });
    }
  }

  const actualizada = await tabla(clase).update({
    where: { id },
    data: { estado, ...(datos.notas !== undefined ? { notas: datos.notas } : {}) },
    include: incluir(clase),
  });

  return normalizar(clase, actualizada);
};

/** Retira una petición. Si estaba aceptada, su plaza vuelve a quedar libre. */
export const borrarSolicitud = async (
  clase: ClaseElemento,
  datos: { cofradiaId: number; id: number },
) => {
  await obtenerCofradiaEditable(datos.cofradiaId);

  const previa = await tabla(clase).findUnique({ where: { id: datos.id } });
  if (!previa || previa.cofradiaId !== datos.cofradiaId) {
    throw new AppError("ELEMENTO_NOT_FOUND", {
      message: "La petición no existe en esta cofradía.",
    });
  }

  await tabla(clase).delete({ where: { id: datos.id } });
  return { message: "Petición retirada." };
};

/**
 * Todas las peticiones de una cofradía, con las tres clases.
 *
 * Van agrupadas por clase para no repetir el nombre tres veces en cada
 * fila, y separadas en la respuesta porque quien las mira —la junta—
 * las repasa por tipo.
 */
export const listarSolicitudes = async (filtro: {
  cofradiaId: number;
  estado?: EstadoSolicitud | undefined;
  hermanoId?: number | undefined;
  cortejoId?: number | undefined;
  elementoId?: number | undefined;
}) => {
  const tramos = await tramosDelCortejo(filtro.cortejoId);
  const base: Filtro = { ...filtro, tramos };

  const leer = async (clase: ClaseElemento) => {
    const filas = await tabla(clase).findMany({
      where: where(clase, base),
      include: incluir(clase),
      orderBy: [{ estado: "asc" }, { id: "asc" }],
    });
    return filas.map((f) => normalizar(clase, f));
  };

  const [puestos, insignias, cargos] = await Promise.all([
    leer("puesto"),
    leer("insignia"),
    leer("cargo"),
  ]);

  return { puestos, insignias, cargos };
};

/** Cuántas hay de cada clase en cada estado, para la cabecera. */
export const contarSolicitudes = async (cofradiaId: number) => {
  const total = (estado: EstadoSolicitud) =>
    Promise.all(
      (["puesto", "insignia", "cargo"] as const).map((clase) =>
        tabla(clase).count({ where: where(clase, { cofradiaId, estado }) }),
      ),
    ).then((ns) => ns.reduce((a, b) => a + b, 0));

  const [pendientes, aceptadas, rechazadas] = await Promise.all([
    total("PENDIENTE"),
    total("ACEPTADA"),
    total("RECHAZADA"),
  ]);

  return { pendientes, aceptadas, rechazadas };
};

/**
 * El hermano tiene que ser de esta hermandad.
 *
 * `Hermano` cuelga de la hermandad y no de la cofradía, así que el
 * salto hay que comprobarlo a mano: sin esto se podría meter a un
 * hermano de otra hermandad en la procesión.
 */
const asegurarHermanoEsDeLaCofradia = async (cofradiaId: number, hermanoId: number) => {
  const hermano = await prisma.hermano.findUnique({
    where: { id: hermanoId },
    select: { hermandadId: true, activo: true },
  });
  if (!hermano) {
    throw new AppError("HERMANDAD_NOT_FOUND", { message: "El hermano no existe." });
  }

  const cofradia = await prisma.cofradia.findUnique({
    where: { id: cofradiaId },
    select: { hermandadId: true },
  });
  if (!cofradia || cofradia.hermandadId !== hermano.hermandadId) {
    throw new AppError("HERMANO_NOT_IN_COFRADIA");
  }

  if (!hermano.activo) {
    throw new AppError("FORBIDDEN_ACTION", {
      message: "El hermano está dado de baja y no puede ocupar un sitio.",
    });
  }
};

/** Prisma avisa de los índices únicos con este código. */
const esViolacionDeUnico = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === "P2002";