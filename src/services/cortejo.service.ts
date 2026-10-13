import { prisma } from "../config/prismaClient.ts";
import {
  asegurarListaDeOrdenValida,
  asegurarNombreLibre,
  obtenerCofradiaEditable,
} from "./guards/cofradia.guards.ts";
import { AppError } from "../errors/AppError.ts";

interface CrearCortejoInput {
  cofradiaId: number;
  nombre: string;
  /** Si se omite, el cortejo se añade al final de la marcha. */
  orden?: number;
}

interface EditCortejoInput {
  nombre?: string;
  orden?: number;
}

export const cortejoService = {
  crearCortejo: async ({ cofradiaId, nombre, orden }: CrearCortejoInput) => {
    await obtenerCofradiaEditable(cofradiaId);

    const existe = await prisma.cortejo.findFirst({ where: { cofradiaId, nombre } });
    asegurarNombreLibre(existe, nombre, "cortejo");

    // Igual que en los tramos: sin orden explícito, el nuevo cortejo
    // entra el último. Así el cliente no tiene que calcular la
    // posición y el arrastre sigue siendo la única forma de reordenar.
    const finalOrden =
      orden ??
      (await prisma.cortejo.count({ where: { cofradiaId } })) + 1;

    return prisma.cortejo.create({
      data: { cofradiaId, nombre, orden: finalOrden },
    });
  },

  listCortejosByCofradia: async (cofradiaId: number) => {
    return prisma.cortejo.findMany({ where: { cofradiaId }, orderBy: { orden: "asc" } });
  },

  editarCortejo: async (cortejoId: number, data: EditCortejoInput) => {
    const cortejo = await prisma.cortejo.findUnique({ where: { id: cortejoId } });
    if (!cortejo) throw new AppError("CORTEJO_NOT_FOUND");

    await obtenerCofradiaEditable(cortejo.cofradiaId);

    return prisma.cortejo.update({ where: { id: cortejoId }, data });
  },

  borrarCortejo: async (cortejoId: number) => {
    const cortejo = await prisma.cortejo.findUnique({ where: { id: cortejoId } });
    if (!cortejo) throw new AppError("CORTEJO_NOT_FOUND");

    await obtenerCofradiaEditable(cortejo.cofradiaId);

    return prisma.cortejo.delete({ where: { id: cortejoId } });
  },

  /**
   * Guarda el nuevo orden de los cortejos a partir de la lista de ids
   * que manda el cliente ya ordenada. Las posiciones 1..n las asigna
   * el servidor: si las calculara el cliente, un `orden` manipulado
   * dejaría huecos en la marcha.
   */
  reordenarCortejos: async (cofradiaId: number, ids: number[]) => {
    await obtenerCofradiaEditable(cofradiaId);

    const actuales = await prisma.cortejo.findMany({
      where: { cofradiaId },
      orderBy: { orden: "asc" },
      select: { id: true },
    });

    asegurarListaDeOrdenValida(
      actuales.map((c) => c.id),
      ids,
    );

    // En transacción: o se guarda el orden entero o no se guarda nada.
    await prisma.$transaction(
      ids.map((id, indice) =>
        prisma.cortejo.update({
          where: { id },
          data: { orden: indice + 1 },
        }),
      ),
    );

    return prisma.cortejo.findMany({
      where: { cofradiaId },
      orderBy: { orden: "asc" },
    });
  },
};
