import { prisma } from "../config/prismaClient.ts";

interface CrearInsigniaInput {
  cofradiaId: number;
  cortejoId?: number;
  nombre: string;
  descripcion?: string;
}

export const insigniaService = {
  crearInsignia: async ({ cofradiaId, cortejoId, nombre, descripcion }: CrearInsigniaInput) => {
    try {
      // 1. Comprobar que la cofradía existe
      const cofradia = await prisma.cofradia.findUnique({ where: { id: cofradiaId } });
      if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");

      // 2. Comprobar que la cofradía está ABIERTA
      if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

      // 3. Validar que no exista otra insignia con el mismo nombre en la cofradía
      const existe = await prisma.insignia.findFirst({
        where: {
          cofradiaId,
          nombre,
        },
      });

      if (existe) throw new Error(`Ya existe una insignia con nombre "${nombre}" en esta cofradía`);

        // 4. Crear la insignia
        const data: {
        cofradiaId: number;
        nombre: string;
        cortejoId?: number;
        descripcion?: string;
        } = {
        cofradiaId,
        nombre,
        };

        if (cortejoId !== undefined) {
        data.cortejoId = cortejoId;
        }

        if (descripcion !== undefined) {
        data.descripcion = descripcion;
        }

        const insignia = await prisma.insignia.create({
        data,
        });


      return insignia;
    } catch (error) {
      console.error("Error en insigniaService.crearInsignia:", error);
      throw error;
    }
  },

  listInsigniasByCofradia: async (cofradiaId: number) => {
    try {
      return await prisma.insignia.findMany({
        where: { cofradiaId },
        orderBy: { nombre: "asc" },
      });
    } catch (error) {
      console.error("Error en insigniaService.listInsigniasByCofradia:", error);
      throw new Error("No se pudieron listar las insignias");
    }
  },
};
