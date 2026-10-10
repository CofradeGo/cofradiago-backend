import { prisma } from "../config/prismaClient.ts";
import {
  asegurarNombreLibre,
  obtenerCofradiaEditable,
} from "./guards/cofradia.guards.ts";
import { AppError } from "../errors/AppError.ts";

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
    await obtenerCofradiaEditable(cofradiaId);

    const existe = await prisma.cortejo.findFirst({ where: { cofradiaId, nombre } });
    asegurarNombreLibre(existe, nombre, "cortejo");
    return prisma.cortejo.create({ data: { cofradiaId, nombre, orden } });
  },

  listCortejosByCofradia: async (cofradiaId: number) => {
    return prisma.cortejo.findMany({ where: { cofradiaId }, orderBy: { orden: "asc" } });
  },

  editarCortejo: async (cortejoId: number, data: EditCortejoInput) => {
    const cortejo = await prisma.cortejo.findUnique({ where: { id: cortejoId } });
    if (!cortejo) throw new AppError("CORTEJO_NOT_FOUND");

    await obtenerCofradiaEditable(cortejo.cofradiaId);

    return prisma.cortejo.update({ where: { id: cortejoId }, data });
  },

  borrarCortejo: async (cortejoId: number) => {
    const cortejo = await prisma.cortejo.findUnique({ where: { id: cortejoId } });
    if (!cortejo) throw new AppError("CORTEJO_NOT_FOUND");

    await obtenerCofradiaEditable(cortejo.cofradiaId);

    return prisma.cortejo.delete({ where: { id: cortejoId } });
  },
};
