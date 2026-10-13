import type { PrismaPromise } from "@prisma/client";
import { prisma } from "../config/prismaClient.ts";
import { obtenerCofradiaEditable } from "./guards/cofradia.guards.ts";
import { AppError } from "../errors/AppError.ts";

/**
 * Qué insignias, cargos y puestos van en cada tramo de la procesión,
 * y cuántas personas hacen falta de cada uno.
 *
 * Las tres clases son lo mismo con distinto nombre: en el tramo 1 hacen
 * falta cinco personas para la Cruz de Guía, diez para los Cirios y un
 * Diputado de Cruz. Por eso comparten código y se llaman igual.
 *
 * Lo que aquí se guarda es cuánto se necesita, no quién ocupa cada
 * plaza: eso son los hermanos, y llegan con el módulo de papeleta de
 * sitio.
 */

/** Tope de plazas por elemento, por si alguien manda un disparate. */
const MAX_PLAZAS = 999;

/** Las tres clases de elemento que se colocan en un tramo. */
export type ClaseElemento = "insignia" | "cargo" | "puesto";

/** Un elemento con el número de personas que hacen falta en el tramo. */
export interface ElementoConPlazas {
  id: number;
  plazas: number;
}

/** Lo que devuelve la asignación, ya normalizado. */
export interface ElementoAsignado {
  id: number;
  nombre: string;
  plazas: number;
}

/**
 * Cada clase habla con Prisma con nombres distintos, así que se
 * declaran una vez y el resto del servicio no distingue entre ellas.
 */
type Operaciones = {
  /** Cómo se nombran enplural en los mensajes de error. */
  etiqueta: string;
  buscarPropios: (cofradiaId: number, ids: number[]) => Promise<{ id: number }[]>;
  borrarDelTramo: (tramoId: number) => PrismaPromise<unknown>;
  crear: (id: number, tramoId: number, plazas: number) => PrismaPromise<unknown>;
  leerDelTramo: (tramoId: number) => Promise<{ plazas: number; [k: string]: unknown }[]>;
  /** Campo del elemento con el nombre, para normalizar la salida. */
  nombre: string;
};

const operaciones: Record<ClaseElemento, Operaciones> = {
  insignia: {
    etiqueta: "insignias",
    nombre: "insignia",
    buscarPropios: (cofradiaId, ids) =>
      prisma.insignia.findMany({
        where: { cofradiaId, id: { in: ids } },
        select: { id: true },
      }),
    borrarDelTramo: (tramoId) => prisma.insigniaTramo.deleteMany({ where: { tramoId } }),
    crear: (insigniaId, tramoId, plazas) =>
      prisma.insigniaTramo.create({ data: { insigniaId, tramoId, plazas } }),
    leerDelTramo: (tramoId) =>
      prisma.insigniaTramo.findMany({
        where: { tramoId },
        include: { insignia: true },
      }) as unknown as Promise<{ plazas: number }[]>,
  },
  cargo: {
    etiqueta: "cargos",
    nombre: "cargo",
    buscarPropios: (cofradiaId, ids) =>
      prisma.cargo.findMany({ where: { cofradiaId, id: { in: ids } }, select: { id: true } }),
    borrarDelTramo: (tramoId) => prisma.cargoTramo.deleteMany({ where: { tramoId } }),
    crear: (cargoId, tramoId, plazas) =>
      prisma.cargoTramo.create({ data: { cargoId, tramoId, plazas } }),
    leerDelTramo: (tramoId) =>
      prisma.cargoTramo.findMany({
        where: { tramoId },
        include: { cargo: true },
      }) as unknown as Promise<{ plazas: number }[]>,
  },
  puesto: {
    etiqueta: "puestos",
    nombre: "puesto",
    buscarPropios: (cofradiaId, ids) =>
      prisma.puesto.findMany({ where: { cofradiaId, id: { in: ids } }, select: { id: true } }),
    borrarDelTramo: (tramoId) => prisma.puestoTramo.deleteMany({ where: { tramoId } }),
    crear: (puestoId, tramoId, plazas) =>
      prisma.puestoTramo.create({ data: { puestoId, tramoId, plazas } }),
    leerDelTramo: (tramoId) =>
      prisma.puestoTramo.findMany({
        where: { tramoId },
        include: { puesto: true },
      }) as unknown as Promise<{ plazas: number }[]>,
  },
};

/**
 * Guarda qué elementos tiene un tramo y cuántas plazas hay de cada uno.
 *
 * Recibe la lista completa de lo que debe quedar, no "añade uno". Así
 * el cliente manda lo que ha seleccionado en la pantalla y no tiene que
 * orquestar altas y bajas de uno en uno; si algo va mal, el tramo se
 * queda como estaba en vez de a medias.
 *
 * `plazas` es cuántas personas hacen falta, no cuántas hay ya: al montar
 * la estructura se sabe que hacen falta tres diputados de tramo aunque
 * todavía no se sepa quiénes.
 */
export const asignarATramo = async (
  clase: ClaseElemento,
  cofradiaId: number,
  cortejoId: number,
  tramoId: number,
  elementos: ElementoConPlazas[],
) => {
  await obtenerCofradiaEditable(cofradiaId);
  await asegurarTramoPertenece(cofradiaId, cortejoId, tramoId);

  const ops = operaciones[clase];

  for (const { plazas } of elementos) {
    if (!Number.isInteger(plazas) || plazas < 1 || plazas > MAX_PLAZAS) {
      throw new AppError("PLAZAS_INVALIDAS", {
        message: `Las plazas deben ser un número entero entre 1 y ${MAX_PLAZAS}.`,
      });
    }
  }

  // Solo se admiten elementos de esta cofradía: mandar uno de otra
  // colgaría de un tramo que no le toca.
  const ids = elementos.map((e) => e.id);
  const propios = ids.length ? await ops.buscarPropios(cofradiaId, ids) : [];

  if (propios.length !== ids.length) {
    throw new AppError("NO_VALID_FIELDS", {
      message: `Alguno de los ${ops.etiqueta} indicados no existe en esta cofradía.`,
    });
  }

  await prisma.$transaction([
    ops.borrarDelTramo(tramoId),
    ...elementos.map(({ id, plazas }) => ops.crear(id, tramoId, plazas)),
  ]);

  const leidos = await ops.leerDelTramo(tramoId);

  return leidos
    .map((fila) => {
      const elemento = fila[ops.nombre] as { id: number; nombre: string };
      return { id: elemento.id, nombre: elemento.nombre, plazas: fila.plazas };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
};

/** Guarda qué insignias tiene un tramo. */
export const asignarInsigniasATramo = (
  cofradiaId: number,
  cortejoId: number,
  tramoId: number,
  insignias: ElementoConPlazas[],
) => asignarATramo("insignia", cofradiaId, cortejoId, tramoId, insignias);

/** Guarda qué cargos tiene un tramo. */
export const asignarCargosATramo = (
  cofradiaId: number,
  cortejoId: number,
  tramoId: number,
  cargos: ElementoConPlazas[],
) => asignarATramo("cargo", cofradiaId, cortejoId, tramoId, cargos);

/** Guarda qué puestos tiene un tramo. */
export const asignarPuestosATramo = (
  cofradiaId: number,
  cortejoId: number,
  tramoId: number,
  puestos: ElementoConPlazas[],
) => asignarATramo("puesto", cofradiaId, cortejoId, tramoId, puestos);

/**
 * El tramo tiene que existir y ser del cortejo y la cofradía que dicen.
 * Sin esto se podría colgar una insignia de un tramo de otra hermandad.
 */
export const asegurarTramoPertenece = async (
  cofradiaId: number,
  cortejoId: number,
  tramoId: number,
) => {
  const tramo = await prisma.tramo.findUnique({
    where: { id: tramoId },
    select: { cofradiaId: true, cortejoId: true },
  });

  if (!tramo) throw new AppError("TRAMO_NOT_FOUND");
  if (tramo.cofradiaId !== cofradiaId) {
    throw new AppError("TRAMO_NOT_BELONG_TO_COFRADIA");
  }
  if (tramo.cortejoId !== cortejoId) {
    throw new AppError("TRAMO_NOT_BELONG_TO_CORTEJO");
  }
};

/**
 * Cuántas plazas de un elemento quedan libres en su tramo.
 *
 * Lo usan las solicitudes para no aceptar a más gente de la que cabe.
 */
export const plazasLibres = async (
  clase: ClaseElemento,
  tramoId: number,
  elementoId: number,
  excluirPeticion?: number,
) => {
  const ops = operaciones[clase];

  const [{ plazas }, ocupadas] = await Promise.all([
    ops.leerDelTramo(tramoId).then((filas) => {
      const fila = filas.find((f) => (f[ops.nombre] as { id: number }).id === elementoId);
      return { plazas: fila?.plazas ?? 0 };
    }),
    contarOcupadas(clase, tramoId, elementoId, excluirPeticion),
  ]);

  return { plazas, ocupadas, libres: plazas - ocupadas };
};

/** Cuántas peticiones aceptadas hay de un elemento en su tramo. */
const contarOcupadas = async (
  clase: ClaseElemento,
  tramoId: number,
  elementoId: number,
  excluirPeticion?: number,
) => {
  const comun = {
    tramoId,
    estado: "ACEPTADA" as const,
    ...(excluirPeticion ? { id: { not: excluirPeticion } } : {}),
  };

  // El nombre de la columna cambia según la clase, pero el resto de la
  // condición es idéntico. El `as never` es para que TypeScript acepte
  // el filtro común en los tres modelos sin quejarse del campo propio
  // de cada uno.
  if (clase === "puesto") {
    return prisma.puestoHermano.count({ where: { ...comun, puestoId: elementoId } as never });
  }
  if (clase === "insignia") {
    return prisma.insigniaHermano.count({
      where: { ...comun, insigniaId: elementoId } as never,
    });
  }
  return prisma.cargoHermano.count({ where: { ...comun, cargoId: elementoId } as never });
};