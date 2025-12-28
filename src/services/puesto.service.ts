import { prisma } from "../config/prismaClient.ts";

interface CrearPuestoInput {
  cofradiaId: number;
  nombre: string;
  codigo?: string; // Opcional
}

export const puestoService = {
  crearPuesto: async ({ cofradiaId, nombre, codigo }: CrearPuestoInput) => {
    try {
      // 1. Comprobar que la cofradía existe
      const cofradia = await prisma.cofradia.findUnique({ where: { id: cofradiaId } });
      if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");

      // 2. Comprobar que está ABIERTA
      if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

      // 3. Comprobar que no existe ya un puesto con el mismo nombre en la cofradía
      const existe = await prisma.puesto.findFirst({ where: { cofradiaId, nombre } });
      if (existe) throw new Error(`Ya existe un puesto con nombre "${nombre}" en esta cofradía`);

      // 4. Crear el puesto
      const puesto = await prisma.puesto.create({
        data: {
          cofradiaId,
          nombre,
          codigo: codigo ?? null, // opcional
        },
      });

      return puesto;
    } catch (error) {
      console.error("Error en puestoService.crearPuesto:", error);
      throw error;
    }
  },

  listPuestosByCofradia: async (cofradiaId: number) => {
    try {
      return await prisma.puesto.findMany({
        where: { cofradiaId },
        orderBy: { nombre: "asc" },
      });
    } catch (error) {
      console.error("Error en puestoService.listPuestosByCofradia:", error);
      throw new Error("No se pudieron listar los puestos");
    }
  },
};
