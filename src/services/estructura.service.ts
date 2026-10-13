import { prisma } from "../config/prismaClient.ts";
import { obtenerCofradiaEditable } from "./guards/cofradia.guards.ts";
import { AppError } from "../errors/AppError.ts";

/**
 * Qué insignias y qué cargos van en cada tramo de la procesión.
 *
 * A los hermanos se llega más adelante, con el módulo de papeleta de
 * sitio. Por ahora esto es solo el armazón: qué tramos hay y qué
 * elementos de la hermandad van en cada uno.
 */

/**
 * Guarda qué insignias tiene un tramo.
 *
 * Recibe la lista completa de ids que deben quedar, no "añade uno".
 * Así el cliente manda lo que ha seleccionado en la pantalla y no
 * tiene que orquestar altas y bajas una a una; si algo va mal, el
 * tramo se queda como estaba en vez de a medias.
 */
export const asignarInsigniasATramo = async (
  cofradiaId: number,
  cortejoId: number,
  tramoId: number,
  insigniaIds: number[],
) => {
  await obtenerCofradiaEditable(cofradiaId);
  await asegurarTramoPertenece(cofradiaId, cortejoId, tramoId);

  // Solo se admiten insignias de esta cofradía: mandar una de otra
  // colgaría de un tramo que no le toca.
  const propias = insigniaIds.length
    ? await prisma.insignia.findMany({
        where: { cofradiaId, id: { in: insigniaIds } },
        select: { id: true },
      })
    : [];

  if (propias.length !== insigniaIds.length) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Alguna de las insignias indicadas no existe en esta cofradía.",
    });
  }

  await prisma.$transaction([
    prisma.insigniaTramo.deleteMany({ where: { tramoId } }),
    ...propias.map(({ id }) =>
      prisma.insigniaTramo.create({ data: { insigniaId: id, tramoId } }),
    ),
  ]);

  return prisma.insignia.findMany({
    where: { id: { in: propias.map((i) => i.id) } },
    orderBy: { nombre: "asc" },
  });
};

/** Guarda qué cargos tiene un tramo. Mismo criterio que las insignias. */
export const asignarCargosATramo = async (
  cofradiaId: number,
  cortejoId: number,
  tramoId: number,
  cargoIds: number[],
) => {
  await obtenerCofradiaEditable(cofradiaId);
  await asegurarTramoPertenece(cofradiaId, cortejoId, tramoId);

  const propios = cargoIds.length
    ? await prisma.cargo.findMany({
        where: { cofradiaId, id: { in: cargoIds } },
        select: { id: true },
      })
    : [];

  if (propios.length !== cargoIds.length) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Alguno de los cargos indicados no existe en esta cofradía.",
    });
  }

  await prisma.$transaction([
    prisma.cargoTramo.deleteMany({ where: { tramoId } }),
    ...propios.map(({ id }) =>
      prisma.cargoTramo.create({ data: { cargoId: id, tramoId } }),
    ),
  ]);

  return prisma.cargo.findMany({
    where: { id: { in: propios.map((c) => c.id) } },
    orderBy: { nombre: "asc" },
  });
};

/**
 * El tramo tiene que existir y ser del cortejo y la cofradía que dicen.
 * Sin esto se podría colgar una insignia de un tramo de otra hermandad.
 */
const asegurarTramoPertenece = async (
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