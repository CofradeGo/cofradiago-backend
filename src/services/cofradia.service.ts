import { prisma } from "../config/prismaClient.ts";

interface CrearCofradiaInput {
  hermandadId: number;
  nombre: string;
  anio: number;
  tipo: string;
}

export const cofradiaService = {
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
};
