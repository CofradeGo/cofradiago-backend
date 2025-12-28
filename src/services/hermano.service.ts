import { prisma } from "../config/prismaClient.ts";
import { Prisma } from "@prisma/client";

export interface ListHermanosOptions {
  hermandadId: number;
  page?: number;
  limit?: number;
  order?: "asc" | "desc";

  search?: string;
  direccion?: string;
  numeroAntiguedad?: number;
  activo?: boolean;

  // 🆕 Filtro por edad
  edadMin?: number;
  edadMax?: number;
}

// Helper para calcular edad (para respuesta al frontend)
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

// Helper para convertir edad → fechaNacimiento (para BD)
const calcularFechaNacimientoDesdeEdad = (
  edadMin?: number,
  edadMax?: number
): Prisma.DateTimeFilter => {
  const hoy = new Date();

  return {
    ...(edadMax !== undefined && {
      gte: new Date(
        hoy.getFullYear() - edadMax,
        hoy.getMonth(),
        hoy.getDate()
      ),
    }),
    ...(edadMin !== undefined && {
      lte: new Date(
        hoy.getFullYear() - edadMin,
        hoy.getMonth(),
        hoy.getDate()
      ),
    }),
  };
};

export const hermanoService = {
  listHermanos: async ({
    hermandadId,
    page = 1,
    limit = 20,
    order = "asc",
    search,
    direccion,
    numeroAntiguedad,
    activo = true,
    edadMin,
    edadMax,
  }: ListHermanosOptions) => {
    const skip = (page - 1) * limit;

    const where: Prisma.HermanoWhereInput = {
      hermandadId,
      activo,
    };

    if (numeroAntiguedad !== undefined) {
      where.numeroAntiguedad = numeroAntiguedad;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { apellidos: { contains: search, mode: "insensitive" } },
      ];
    }

    if (direccion) {
      where.direccion = {
        contains: direccion,
        mode: "insensitive",
      };
    }

    // 🆕 Filtro por rango de edad
    if (edadMin !== undefined || edadMax !== undefined) {
      where.fechaNacimiento = calcularFechaNacimientoDesdeEdad(
        edadMin,
        edadMax
      );
    }

    const total = await prisma.hermano.count({ where });

    const hermanos = await prisma.hermano.findMany({
      where,
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
      orderBy: {
        numeroAntiguedad: order,
      },
      skip,
      take: limit,
    });

    const data = hermanos.map((h) => ({
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
