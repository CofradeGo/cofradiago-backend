import { prisma } from "../config/prismaClient.ts";

interface ListHermanosOptions {
  hermandadId: number; // se toma del usuario autenticado
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
}

export const hermanoService = {
  listHermanos: async ({
    hermandadId,
    page = 1,
    limit = 20,
    order = "asc",
  }: ListHermanosOptions) => {
    // Calculamos desde qué registro empezar
    const skip = (page - 1) * limit;

    // Contamos solo los hermanos activos de esta hermandad
    const total = await prisma.hermano.count({
      where: {
        hermandadId,
        activo: true,
      },
    });

    // Obtenemos los hermanos activos con paginación y ordenación
    const data = await prisma.hermano.findMany({
      where: {
        hermandadId,
        activo: true, // filtramos solo activos
      },
      select: {
        numeroAntiguedad: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        direccion: true,
        email: true,
        // NO devolvemos 'activo', no es necesario en este listado
      },
      orderBy: { numeroAntiguedad: order },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  },
};
