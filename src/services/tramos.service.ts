import { prisma } from "../config/prismaClient.ts";
import {
  asegurarNombreLibre,
  obtenerCofradiaEditable,
} from "./guards/cofradia.guards.ts";
import { AppError } from "../errors/AppError.ts";

interface CrearTramoInput {
  cofradiaId: number;
  cortejoId: number;
  nombre: string;
  orden?: number;
}

interface EditarTramoInput {
  tramoId: number;
  cofradiaId: number;
  cortejoId: number;
  nombre?: string;
  orden?: number;
}

export const tramoService = {
  /* =====================================================
     CREAR TRAMO
  ===================================================== */
  crearTramo: async ({ cofradiaId, cortejoId, nombre, orden }: CrearTramoInput) => {
    await obtenerCofradiaEditable(cofradiaId);

    const cortejo = await prisma.cortejo.findUnique({ where: { id: cortejoId } });
    if (!cortejo) throw new AppError("CORTEJO_NOT_FOUND");
    if (cortejo.cofradiaId !== cofradiaId)
      throw new AppError("CORTEJO_NOT_BELONG_TO_COFRADIA");

    const existe = await prisma.tramo.findFirst({
      where: { cortejoId, nombre },
    });
    asegurarNombreLibre(existe, nombre, "tramo");

    const finalOrden =
      orden ??
      (await prisma.tramo.count({
        where: { cortejoId },
      })) + 1;

    return prisma.tramo.create({
      data: {
        cofradiaId,
        cortejoId,
        nombre,
        orden: finalOrden,
      },
    });
  },

  /* =====================================================
     LISTAR TRAMOS
  ===================================================== */
  listarTramos: async (cofradiaId: number, cortejoId: number) => {
    const cortejo = await prisma.cortejo.findUnique({ where: { id: cortejoId } });
    if (!cortejo) throw new AppError("CORTEJO_NOT_FOUND");
    if (cortejo.cofradiaId !== cofradiaId)
      throw new AppError("CORTEJO_NOT_BELONG_TO_COFRADIA");

    return prisma.tramo.findMany({
      where: { cortejoId },
      orderBy: { orden: "asc" },
    });
  },

  /* =====================================================
     EDITAR TRAMO
  ===================================================== */
  editarTramo: async ({
    tramoId,
    cofradiaId,
    cortejoId,
    nombre,
    orden,
  }: EditarTramoInput) => {
    await obtenerCofradiaEditable(cofradiaId);

    const tramo = await prisma.tramo.findUnique({ where: { id: tramoId } });
    if (!tramo) throw new AppError("TRAMO_NOT_FOUND");
    if (tramo.cofradiaId !== cofradiaId)
      throw new AppError("TRAMO_NOT_BELONG_TO_COFRADIA");
    if (tramo.cortejoId !== cortejoId)
      throw new AppError("TRAMO_NOT_BELONG_TO_CORTEJO");

    return prisma.tramo.update({
      where: { id: tramoId },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(orden !== undefined && { orden }),
      },
    });
  },

  /* =====================================================
     BORRAR TRAMO
  ===================================================== */
  borrarTramo: async (cofradiaId: number, cortejoId: number, tramoId: number) => {
    await obtenerCofradiaEditable(cofradiaId);

    const tramo = await prisma.tramo.findUnique({ where: { id: tramoId } });
    if (!tramo) throw new AppError("TRAMO_NOT_FOUND");
    if (tramo.cofradiaId !== cofradiaId)
      throw new AppError("TRAMO_NOT_BELONG_TO_COFRADIA");
    if (tramo.cortejoId !== cortejoId)
      throw new AppError("TRAMO_NOT_BELONG_TO_CORTEJO");

    await prisma.tramo.delete({ where: { id: tramoId } });
    return { deleted: true };
  },
};
