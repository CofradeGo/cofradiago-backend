import { prisma } from "../config/prismaClient.ts";
import type { InsigniaElemento } from "@prisma/client";

interface CrearElementoInput {
  insigniaId: number;
  tipo: string;      // "vara", "farol", "otro"
  cantidad?: number; // opcional, por defecto 1
}

interface EditarElementoInput {
  elementoId: number;
  tipo?: string;
  cantidad?: number;
}

export const insigniaElementoService = {
  /**
   * Crear un elemento para una insignia
   */
  crearElemento: async ({ insigniaId, tipo, cantidad = 1 }: CrearElementoInput): Promise<InsigniaElemento> => {
    // 1️⃣ Comprobar que la insignia existe
    const insignia = await prisma.insignia.findUnique({ where: { id: insigniaId } });
    if (!insignia) throw new Error("INSIGNIA_NOT_FOUND");

    return prisma.insigniaElemento.create({
      data: { insigniaId, tipo, cantidad },
    });
  },

  /**
   * Listar elementos de una insignia
   */
  listElementosByInsignia: async (insigniaId: number): Promise<InsigniaElemento[]> => {
    // Comprobamos que la insignia existe
    const insignia = await prisma.insignia.findUnique({ where: { id: insigniaId } });
    if (!insignia) throw new Error("INSIGNIA_NOT_FOUND");

    return prisma.insigniaElemento.findMany({
      where: { insigniaId },
      orderBy: { id: "asc" },
    });
  },

  /**
   * Editar un elemento
   */
  editarElemento: async ({ elementoId, tipo, cantidad }: EditarElementoInput): Promise<InsigniaElemento> => {
    const elemento = await prisma.insigniaElemento.findUnique({ where: { id: elementoId } });
    if (!elemento) throw new Error("ELEMENTO_NOT_FOUND");

    return prisma.insigniaElemento.update({
      where: { id: elementoId },
      data: {
        ...(tipo !== undefined && { tipo }),
        ...(cantidad !== undefined && { cantidad }),
      },
    });
  },

  /**
   * Borrar un elemento
   */
  borrarElemento: async (elementoId: number): Promise<{ deleted: true }> => {
    const elemento = await prisma.insigniaElemento.findUnique({ where: { id: elementoId } });
    if (!elemento) throw new Error("ELEMENTO_NOT_FOUND");

    await prisma.insigniaElemento.delete({ where: { id: elementoId } });
    return { deleted: true };
  },
};
