import { prisma } from "../config/prismaClient.ts";

interface CrearCargoInput {
  cofradiaId: number;
  nombre: string;
}

interface EditarCargoInput {
  cargoId: number;
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

      // 3️⃣ Comprobar duplicado
      const existe = await prisma.cargo.findFirst({
        where: {
          cofradiaId,
          nombre,
        },
      });

      if (existe) {
        throw new Error(`Ya existe un cargo con nombre "${nombre}" en esta cofradía`);
      }

      // 4️⃣ Crear cargo
      return await prisma.cargo.create({
        data: {
          cofradiaId,
          nombre,
        },
      });
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

  /**
   * Editar un cargo
   */
  editarCargo: async ({ cargoId, nombre }: EditarCargoInput) => {
    try {
      // 1️⃣ Buscar cargo con su cofradía
      const cargo = await prisma.cargo.findUnique({
        where: { id: cargoId },
        include: { cofradia: true },
      });

      if (!cargo) {
        throw new Error("CARGO_NOT_FOUND");
      }

      // 2️⃣ Cofradía abierta
      if (cargo.cofradia.estado !== "ABIERTA") {
        throw new Error("COFRADIA_CERRADA");
      }

      // 3️⃣ Comprobar duplicado
      const existe = await prisma.cargo.findFirst({
        where: {
          cofradiaId: cargo.cofradiaId,
          nombre,
          NOT: { id: cargoId },
        },
      });

      if (existe) {
        throw new Error(`Ya existe un cargo con nombre "${nombre}" en esta cofradía`);
      }

      // 4️⃣ Actualizar
      return await prisma.cargo.update({
        where: { id: cargoId },
        data: { nombre },
      });
    } catch (error) {
      console.error("Error en cargoService.editarCargo:", error);
      throw error;
    }
  },

  /**
   * Borrar un cargo
   */
  borrarCargo: async (cargoId: number) => {
    try {
      // 1️⃣ Buscar cargo + cofradía
      const cargo = await prisma.cargo.findUnique({
        where: { id: cargoId },
        include: { cofradia: true },
      });

      if (!cargo) {
        throw new Error("CARGO_NOT_FOUND");
      }

      // 2️⃣ Cofradía abierta
      if (cargo.cofradia.estado !== "ABIERTA") {
        throw new Error("COFRADIA_CERRADA");
      }

      // 3️⃣ Borrar
      await prisma.cargo.delete({
        where: { id: cargoId },
      });
    } catch (error) {
      console.error("Error en cargoService.borrarCargo:", error);
      throw error;
    }
  },
};
