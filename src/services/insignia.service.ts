import { prisma } from "../config/prismaClient.ts";

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

export const insigniaService = {
  /**
   * Crear insignia
   */
  crearInsignia: async ({
    cofradiaId,
    cortejoId,
    nombre,
    descripcion,
  }: CrearInsigniaInput) => {
    const cofradia = await prisma.cofradia.findUnique({
      where: { id: cofradiaId },
    });

    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    const existe = await prisma.insignia.findFirst({
      where: { cofradiaId, nombre },
    });

    if (existe) {
      throw new Error(
        `Ya existe una insignia con nombre "${nombre}" en esta cofradía`
      );
    }

    if (cortejoId !== undefined) {
      const cortejo = await prisma.cortejo.findUnique({
        where: { id: cortejoId },
      });

      if (!cortejo) throw new Error("CORTEJO_NOT_FOUND");
      if (cortejo.cofradiaId !== cofradiaId) {
        throw new Error("CORTEJO_NOT_BELONG_TO_COFRADIA");
      }
    }

    return prisma.insignia.create({
      data: {
        cofradiaId,
        nombre,
        ...(descripcion !== undefined && { descripcion }),
        ...(cortejoId !== undefined && { cortejoId }),
      },
    });
  },

  /**
   * Listar insignias por cofradía
   */
  listInsigniasByCofradia: async (cofradiaId: number) => {
    return prisma.insignia.findMany({
      where: { cofradiaId },
      orderBy: { nombre: "asc" },
    });
  },

  /**
   * Editar insignia
   */
  editarInsignia: async ({
    cofradiaId,
    insigniaId,
    nombre,
    descripcion,
    cortejoId,
  }: EditarInsigniaInput) => {
    const insignia = await prisma.insignia.findUnique({
      where: { id: insigniaId },
    });

    if (!insignia) throw new Error("INSIGNIA_NOT_FOUND");
    if (insignia.cofradiaId !== cofradiaId) {
      throw new Error("INSIGNIA_NOT_BELONG_TO_COFRADIA");
    }

    const cofradia = await prisma.cofradia.findUnique({
      where: { id: cofradiaId },
    });

    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    if (nombre !== undefined) {
      const existe = await prisma.insignia.findFirst({
        where: {
          cofradiaId,
          nombre,
          NOT: { id: insigniaId },
        },
      });

      if (existe) {
        throw new Error(
          `Ya existe una insignia con nombre "${nombre}" en esta cofradía`
        );
      }
    }

    if (cortejoId !== undefined && cortejoId !== null) {
      const cortejo = await prisma.cortejo.findUnique({
        where: { id: cortejoId },
      });

      if (!cortejo) throw new Error("CORTEJO_NOT_FOUND");
      if (cortejo.cofradiaId !== cofradiaId) {
        throw new Error("CORTEJO_NOT_BELONG_TO_COFRADIA");
      }
    }

    return prisma.insignia.update({
      where: { id: insigniaId },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(cortejoId !== undefined && { cortejoId }),
      },
    });
  },

  /**
   * Borrar insignia
   */
  borrarInsignia: async (cofradiaId: number, insigniaId: number) => {
    const insignia = await prisma.insignia.findUnique({
      where: { id: insigniaId },
    });

    if (!insignia) throw new Error("INSIGNIA_NOT_FOUND");
    if (insignia.cofradiaId !== cofradiaId) {
      throw new Error("INSIGNIA_NOT_BELONG_TO_COFRADIA");
    }

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
