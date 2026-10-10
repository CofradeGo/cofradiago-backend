import { prisma } from "../config/prismaClient.ts";
import { AppError } from "../errors/AppError.ts";
import {
  asegurarNombreLibre,
  obtenerCofradiaEditable,
} from "./guards/cofradia.guards.ts";

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
    // 1️⃣ La cofradía debe existir y admitir cambios
    await obtenerCofradiaEditable(cofradiaId);

    // 2️⃣ Evitar duplicados
    const existe = await prisma.puesto.findFirst({ where: { cofradiaId, nombre } });
    asegurarNombreLibre(existe, nombre, "puesto");

    // 3️⃣ Construcción segura del data
    const data: {
      cofradiaId: number;
      nombre: string;
      codigo?: string | null;
    } = { cofradiaId, nombre };

    if (codigo !== undefined) data.codigo = codigo;

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

    if (!puesto) throw new AppError("PUESTO_NOT_FOUND");

    await obtenerCofradiaEditable(puesto.cofradiaId);

    // Evitar duplicados de nombre, excluyendo el propio puesto
    if (input.nombre !== undefined) {
      const existe = await prisma.puesto.findFirst({
        where: {
          cofradiaId: puesto.cofradiaId,
          nombre: input.nombre,
          NOT: { id: puestoId },
        },
      });
      asegurarNombreLibre(existe, input.nombre, "puesto");
    }

    // Construcción segura del update: solo los campos enviados
    const data: { nombre?: string; codigo?: string | null } = {};
    if (input.nombre !== undefined) data.nombre = input.nombre;
    if (input.codigo !== undefined) data.codigo = input.codigo;

    return prisma.puesto.update({ where: { id: puestoId }, data });
  },

  /* =====================================================
     BORRAR PUESTO
  ===================================================== */
  borrarPuesto: async (puestoId: number) => {
    const puesto = await prisma.puesto.findUnique({
      where: { id: puestoId },
    });

    if (!puesto) throw new AppError("PUESTO_NOT_FOUND");

    await obtenerCofradiaEditable(puesto.cofradiaId);

    return prisma.puesto.delete({ where: { id: puestoId } });
  },
};
