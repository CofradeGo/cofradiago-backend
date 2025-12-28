import { prisma } from "../config/prismaClient.ts";

interface CrearCortejoInput {
  cofradiaId: number;
  nombre: string;
  orden: number;
}

export const cortejoService = {
  crearCortejo: async ({ cofradiaId, nombre, orden }: CrearCortejoInput) => {
    try {
      // 1. Comprobar que la cofradía existe
      const cofradia = await prisma.cofradia.findUnique({
        where: { id: cofradiaId },
      });

      if (!cofradia) {
        throw new Error("COFRADIA_NOT_FOUND");
      }

      // 2. Comprobar que está ABIERTA
      if (cofradia.estado !== "ABIERTA") {
        throw new Error("COFRADIA_CERRADA");
      }

      // 3. Comprobar que no existe ya un cortejo con el mismo nombre en la cofradía
      const existe = await prisma.cortejo.findFirst({
        where: {
          cofradiaId,
          nombre,
        },
      });

      if (existe) {
        throw new Error(
          `Ya existe un cortejo con nombre "${nombre}" en esta cofradía`
        );
      }

      // 4. Crear el cortejo
      const cortejo = await prisma.cortejo.create({
        data: {
          cofradiaId,
          nombre,
          orden,
        },
      });

      return cortejo;
    } catch (error) {
      console.error("Error en cortejoService.crearCortejo:", error);
      throw error;
    }
  },

  listCortejosByCofradia: async (cofradiaId: number) => {
    try {
      return await prisma.cortejo.findMany({
        where: { cofradiaId },
        orderBy: { orden: "asc" },
      });
    } catch (error) {
      console.error(
        "Error en cortejoService.listCortejosByCofradia:",
        error
      );
      throw new Error("No se pudieron listar los cortejos");
    }
  },
};
