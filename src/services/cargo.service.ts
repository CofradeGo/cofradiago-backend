import { prisma } from "../config/prismaClient.ts";

interface CrearCargoInput {
  cofradiaId: number;
  nombre: string;
}

export const cargoService = {
  /**
   * Crear un cargo en una cofradía
   */
  crearCargo: async ({ cofradiaId, nombre }: CrearCargoInput) => {
    try {
      // 1️⃣ Comprobar que la cofradía existe
      const cofradia = await prisma.cofradia.findUnique({
        where: { id: cofradiaId },
      });

      if (!cofradia) {
        throw new Error("COFRADIA_NOT_FOUND");
      }

      // 2️⃣ Comprobar que la cofradía está ABIERTA
      if (cofradia.estado !== "ABIERTA") {
        throw new Error("COFRADIA_CERRADA");
      }

      // 3️⃣ Comprobar que no existe ya un cargo con el mismo nombre
      const existe = await prisma.cargo.findFirst({
        where: {
          cofradiaId,
          nombre,
        },
      });

      if (existe) {
        throw new Error(
          `Ya existe un cargo con nombre "${nombre}" en esta cofradía`
        );
      }

      // 4️⃣ Crear el cargo
      const cargo = await prisma.cargo.create({
        data: {
          cofradiaId,
          nombre,
        },
      });

      return cargo;
    } catch (error) {
      console.error("Error en cargoService.crearCargo:", error);
      throw error;
    }
  },

  /**
   * Listar cargos de una cofradía
   */
  listCargosByCofradia: async (cofradiaId: number) => {
    try {
      return await prisma.cargo.findMany({
        where: { cofradiaId },
        orderBy: { nombre: "asc" },
      });
    } catch (error) {
      console.error("Error en cargoService.listCargosByCofradia:", error);
      throw new Error("No se pudieron listar los cargos");
    }
  },
};
