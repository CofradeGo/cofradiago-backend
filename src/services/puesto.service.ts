import { prisma } from "../config/prismaClient.ts";

interface CrearPuestoInput {
  cofradiaId: number;
  nombre: string;
  codigo?: string;
}

interface EditarPuestoInput {
  nombre?: string;
  codigo?: string;
}

export const puestoService = {
  /* =====================================================
     CREAR PUESTO
  ===================================================== */
  crearPuesto: async ({ cofradiaId, nombre, codigo }: CrearPuestoInput) => {
    // 1️⃣ Validar cofradía
    const cofradia = await prisma.cofradia.findUnique({
      where: { id: cofradiaId },
    });

    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    // 2️⃣ Evitar duplicados
    const existe = await prisma.puesto.findFirst({
      where: { cofradiaId, nombre },
    });

    if (existe) {
      throw new Error(
        `Ya existe un puesto con nombre "${nombre}" en esta cofradía`
      );
    }

    // 3️⃣ Construcción segura del data
    const data: {
      cofradiaId: number;
      nombre: string;
      codigo?: string | null;
    } = {
      cofradiaId,
      nombre,
    };

    if (codigo !== undefined) {
      data.codigo = codigo;
    }

    return prisma.puesto.create({ data });
  },

  /* =====================================================
     LISTAR PUESTOS
  ===================================================== */
  listPuestosByCofradia: async (cofradiaId: number) => {
    return prisma.puesto.findMany({
      where: { cofradiaId },
      orderBy: { nombre: "asc" },
    });
  },

  /* =====================================================
     EDITAR PUESTO
  ===================================================== */
  editarPuesto: async (puestoId: number, input: EditarPuestoInput) => {
    const puesto = await prisma.puesto.findUnique({
      where: { id: puestoId },
    });

    if (!puesto) throw new Error("PUESTO_NOT_FOUND");

    const cofradia = await prisma.cofradia.findUnique({
      where: { id: puesto.cofradiaId },
    });

    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    // Evitar duplicados de nombre
    if (input.nombre !== undefined) {
      const existe = await prisma.puesto.findFirst({
        where: {
          cofradiaId: puesto.cofradiaId,
          nombre: input.nombre,
          NOT: { id: puestoId },
        },
      });

      if (existe) {
        throw new Error(
          `Ya existe un puesto con nombre "${input.nombre}" en esta cofradía`
        );
      }
    }

    // Construcción segura del update
    const data: {
      nombre?: string;
      codigo?: string | null;
    } = {};

    if (input.nombre !== undefined) {
      data.nombre = input.nombre;
    }

    if (input.codigo !== undefined) {
      data.codigo = input.codigo;
    }

    return prisma.puesto.update({
      where: { id: puestoId },
      data,
    });
  },

  /* =====================================================
     BORRAR PUESTO
  ===================================================== */
  borrarPuesto: async (puestoId: number) => {
    const puesto = await prisma.puesto.findUnique({
      where: { id: puestoId },
    });

    if (!puesto) throw new Error("PUESTO_NOT_FOUND");

    const cofradia = await prisma.cofradia.findUnique({
      where: { id: puesto.cofradiaId },
    });

    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    return prisma.puesto.delete({
      where: { id: puestoId },
    });
  },
};
