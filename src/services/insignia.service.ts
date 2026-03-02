import { prisma } from "../config/prismaClient.ts";
import type { Insignia, Prisma } from "@prisma/client";

interface CrearInsigniaInput {
  cofradiaId: number;
  cortejoId?: number;
  nombre: string;
  descripcion?: string;
}

interface EditarInsigniaInput {
  cofradiaId: number;
  insigniaId: number;
  nombre?: string;
  descripcion?: string;
  cortejoId?: number | null;
}

/* =====================================================
   HELPERS
===================================================== */

const validateCortejoBelongsToCofradia = async (
  cortejoId?: number,
  cofradiaId?: number
) => {
  if (!cortejoId) return;

  const cortejo = await prisma.cortejo.findUnique({
    where: { id: cortejoId },
  });

  if (!cortejo) throw new Error("CORTEJO_NOT_FOUND");
  if (cortejo.cofradiaId !== cofradiaId)
    throw new Error("CORTEJO_NOT_BELONG_TO_COFRADIA");
};

const buildCortejosUpdate = (cortejoId: number | null) => {
  if (cortejoId === null) {
    return { set: [] };
  }

  return { connect: { id: cortejoId } };
};

/* =====================================================
   SERVICE
===================================================== */

export const insigniaService = {
  crearInsignia: async ({
    cofradiaId,
    cortejoId,
    nombre,
    descripcion,
  }: CrearInsigniaInput): Promise<Insignia> => {
    const cofradia = await prisma.cofradia.findUnique({
      where: { id: cofradiaId },
    });

    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    const existe = await prisma.insignia.findFirst({
      where: { cofradiaId, nombre },
    });

    if (existe)
      throw new Error(`Ya existe una insignia con nombre "${nombre}"`);

    await validateCortejoBelongsToCofradia(cortejoId, cofradiaId);

    return prisma.insignia.create({
      data: {
        cofradiaId,
        nombre,
        ...(descripcion !== undefined && { descripcion }),
        ...(cortejoId !== undefined && {
          cortejos: { connect: { id: cortejoId } },
        }),
      },
      include: { cortejos: true },
    });
  },

  listInsigniasByCofradia: async (
    cofradiaId: number
  ): Promise<Insignia[]> => {
    return prisma.insignia.findMany({
      where: { cofradiaId },
      orderBy: { nombre: "asc" },
      include: { cortejos: true },
    });
  },

  editarInsignia: async ({
    cofradiaId,
    insigniaId,
    nombre,
    descripcion,
    cortejoId,
  }: EditarInsigniaInput): Promise<Insignia> => {
    const insignia = await prisma.insignia.findUnique({
      where: { id: insigniaId },
    });

    if (!insignia) throw new Error("INSIGNIA_NOT_FOUND");
    if (insignia.cofradiaId !== cofradiaId)
      throw new Error("INSIGNIA_NOT_BELONG_TO_COFRADIA");

    const cofradia = await prisma.cofradia.findUnique({
      where: { id: cofradiaId },
    });

    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    if (nombre) {
      const existe = await prisma.insignia.findFirst({
        where: {
          cofradiaId,
          nombre,
          NOT: { id: insigniaId },
        },
      });

      if (existe)
        throw new Error(`Ya existe una insignia con nombre "${nombre}"`);
    }

    await validateCortejoBelongsToCofradia(
      cortejoId ?? undefined,
      cofradiaId
    );

    const data: Prisma.InsigniaUpdateInput = {
      ...(nombre !== undefined && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
      ...(cortejoId !== undefined && {
        cortejos: buildCortejosUpdate(cortejoId),
      }),
    };

    return prisma.insignia.update({
      where: { id: insigniaId },
      data,
      include: { cortejos: true },
    });
  },

  borrarInsignia: async (
    cofradiaId: number,
    insigniaId: number
  ): Promise<{ deleted: true }> => {
    const insignia = await prisma.insignia.findUnique({
      where: { id: insigniaId },
    });

    if (!insignia) throw new Error("INSIGNIA_NOT_FOUND");
    if (insignia.cofradiaId !== cofradiaId)
      throw new Error("INSIGNIA_NOT_BELONG_TO_COFRADIA");

    const cofradia = await prisma.cofradia.findUnique({
      where: { id: cofradiaId },
    });

    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    await prisma.insignia.delete({
      where: { id: insigniaId },
    });

    return { deleted: true };
  },
};
