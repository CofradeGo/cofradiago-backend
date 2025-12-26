import { prisma } from "../config/prismaClient.ts";

interface ListHermanosOptions {
  hermandadId: number;
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
}

// Helper para calcular edad
const calcularEdad = (fechaNacimiento: Date | null): number | null => {
  if (!fechaNacimiento) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const m = hoy.getMonth() - fechaNacimiento.getMonth();

  if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }

  return edad;
};

export const hermanoService = {
  listHermanos: async ({
    hermandadId,
    page = 1,
    limit = 20,
    order = "asc",
  }: ListHermanosOptions) => {
    const skip = (page - 1) * limit;

    const total = await prisma.hermano.count({
      where: {
        hermandadId,
        activo: true,
      },
    });

    const hermanos = await prisma.hermano.findMany({
      where: {
        hermandadId,
        activo: true,
      },
      select: {
        numeroAntiguedad: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        direccion: true,
        email: true,
        fechaNacimiento: true,
        dni: true,
      },
      orderBy: { numeroAntiguedad: order },
      skip,
      take: limit,
    });

    const data = hermanos.map(h => ({
      numeroAntiguedad: h.numeroAntiguedad,
      nombre: h.nombre,
      apellidos: h.apellidos,
      telefono: h.telefono,
      direccion: h.direccion,
      email: h.email,
      dni: h.dni,
      edad: calcularEdad(h.fechaNacimiento),
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  },
};
