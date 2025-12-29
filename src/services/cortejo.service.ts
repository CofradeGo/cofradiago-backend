import { prisma } from "../config/prismaClient.ts";

interface CrearCortejoInput {
  cofradiaId: number;
  nombre: string;
  orden: number;
}

interface EditCortejoInput {
  nombre?: string;
  orden?: number;
}

export const cortejoService = {
  crearCortejo: async ({ cofradiaId, nombre, orden }: CrearCortejoInput) => {
    const cofradia = await prisma.cofradia.findUnique({ where: { id: cofradiaId } });
    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    const existe = await prisma.cortejo.findFirst({ where: { cofradiaId, nombre } });
    if (existe) throw new Error(`Ya existe un cortejo con nombre "${nombre}" en esta cofradía`);

    return prisma.cortejo.create({ data: { cofradiaId, nombre, orden } });
  },

  listCortejosByCofradia: async (cofradiaId: number) => {
    return prisma.cortejo.findMany({ where: { cofradiaId }, orderBy: { orden: "asc" } });
  },

  editarCortejo: async (cortejoId: number, data: EditCortejoInput) => {
    const cortejo = await prisma.cortejo.findUnique({ where: { id: cortejoId } });
    if (!cortejo) throw new Error("CORTEJO_NOT_FOUND");

    const cofradia = await prisma.cofradia.findUnique({ where: { id: cortejo.cofradiaId } });
    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    return prisma.cortejo.update({ where: { id: cortejoId }, data });
  },

  borrarCortejo: async (cortejoId: number) => {
    const cortejo = await prisma.cortejo.findUnique({ where: { id: cortejoId } });
    if (!cortejo) throw new Error("CORTEJO_NOT_FOUND");

    const cofradia = await prisma.cofradia.findUnique({ where: { id: cortejo.cofradiaId } });
    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    return prisma.cortejo.delete({ where: { id: cortejoId } });
  },
};
