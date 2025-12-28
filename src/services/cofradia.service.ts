import { prisma } from "../config/prismaClient.ts";

// Input para crear cofradía
export interface CrearCofradiaInput {
  hermandadId: number;
  nombre: string;
  anio: number;
  tipo: string;
}

// Opciones para listar cofradías
export interface ListCofradiasOptions {
  hermandadId: number;
  order?: "asc" | "desc";
  estado?: "ABIERTA" | "CERRADA" | undefined; // <-- Permite undefined
}

export const cofradiaService = {
  // Crear cofradía
  crearCofradia: async ({ hermandadId, nombre, anio, tipo }: CrearCofradiaInput) => {
    // Verificar que no exista otra cofradía con el mismo nombre y año en esta hermandad
    const existe = await prisma.cofradia.findUnique({
      where: {
        hermandadId_nombre_anio: {
          hermandadId,
          nombre,
          anio,
        },
      },
    });

    if (existe) {
      throw new Error(`Ya existe una cofradía con nombre "${nombre}" y año ${anio} en esta hermandad`);
    }

    // Crear la cofradía en estado ABIERTA por defecto
    const cofradia = await prisma.cofradia.create({
      data: {
        hermandadId,
        nombre,
        anio,
        tipo,
        estado: "ABIERTA",
      },
    });

    return cofradia;
  },

  // Listar cofradías
  listCofradias: async ({ hermandadId, order = "desc", estado }: ListCofradiasOptions) => {
    try {
      // Construimos el filtro
      const where: { hermandadId: number; estado?: "ABIERTA" | "CERRADA" } = { hermandadId };
      if (estado) {
        where.estado = estado;
      }

      const cofradias = await prisma.cofradia.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          anio: true,
          tipo: true,
          estado: true,
        },
        orderBy: { anio: order },
      });

      return cofradias;
    } catch (error) {
      console.error("Error en cofradiaService.listCofradias:", error);
      throw new Error("No se pudieron listar las cofradías");
    }
  },
};
