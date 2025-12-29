import { prisma } from "../config/prismaClient.ts";

// Input para crear cofradía
export interface CrearCofradiaInput {
  hermandadId: number;
  nombre: string;
  anio: number;
  tipo: string;
}

// Input para actualizar cofradía
export interface ActualizarCofradiaInput {
  nombre?: string;
  anio?: number;
  tipo?: string;
}

// Opciones para listar cofradías
export interface ListCofradiasOptions {
  hermandadId: number;
  order?: "asc" | "desc";
  estado?: "ABIERTA" | "CERRADA" | undefined;
}

export const cofradiaService = {
  crearCofradia: async ({ hermandadId, nombre, anio, tipo }: CrearCofradiaInput) => {
    const existe = await prisma.cofradia.findUnique({
      where: { hermandadId_nombre_anio: { hermandadId, nombre, anio } },
    });

    if (existe) {
      throw new Error(`Ya existe una cofradía con nombre "${nombre}" y año ${anio} en esta hermandad`);
    }

    const cofradia = await prisma.cofradia.create({
      data: { hermandadId, nombre, anio, tipo, estado: "ABIERTA" },
    });

    return cofradia;
  },

  listCofradias: async ({ hermandadId, order = "desc", estado }: ListCofradiasOptions) => {
    try {
      const where: { hermandadId: number; estado?: "ABIERTA" | "CERRADA" } = { hermandadId };
      if (estado) where.estado = estado;

      return await prisma.cofradia.findMany({
        where,
        select: { id: true, nombre: true, anio: true, tipo: true, estado: true },
        orderBy: { anio: order },
      });
    } catch (error) {
      console.error("Error en cofradiaService.listCofradias:", error);
      throw new Error("No se pudieron listar las cofradías");
    }
  },

  actualizarCofradia: async (cofradiaId: number, data: ActualizarCofradiaInput) => {
    const cofradia = await prisma.cofradia.findUnique({ where: { id: cofradiaId } });
    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    // Validar unicidad si se cambia nombre y año
    if ((data.nombre && data.anio) && 
        (data.nombre !== cofradia.nombre || data.anio !== cofradia.anio)) {
      const existe = await prisma.cofradia.findUnique({
        where: { hermandadId_nombre_anio: { hermandadId: cofradia.hermandadId, nombre: data.nombre, anio: data.anio } },
      });
      if (existe) throw new Error(`Ya existe una cofradía con nombre "${data.nombre}" y año ${data.anio}`);
    }

    return await prisma.cofradia.update({ where: { id: cofradiaId }, data });
  },

  borrarCofradia: async (cofradiaId: number) => {
    const cofradia = await prisma.cofradia.findUnique({ where: { id: cofradiaId } });
    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    // Borrar todo lo relacionado (cortejos, puestos, cargos, insignias)
    await prisma.$transaction([
      prisma.cortejo.deleteMany({ where: { cofradiaId } }),
      prisma.puesto.deleteMany({ where: { cofradiaId } }),
      prisma.cargo.deleteMany({ where: { cofradiaId } }),
      prisma.insignia.deleteMany({ where: { cofradiaId } }),
      prisma.cofradia.delete({ where: { id: cofradiaId } }),
    ]);

    return { message: "Cofradía y todos sus elementos relacionados borrados correctamente" };
  },
};
