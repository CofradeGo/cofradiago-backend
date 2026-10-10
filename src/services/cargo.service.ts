import { prisma } from "../config/prismaClient.ts";
import { AppError } from "../errors/AppError.ts";
import {
  asegurarNombreLibre,
  obtenerCofradiaEditable,
} from "./guards/cofradia.guards.ts";

interface CrearCargoInput {
  cofradiaId: number;
  nombre: string;
}

interface EditarCargoInput {
  cargoId: number;
  nombre: string;
}

export const cargoService = {
  /**
   * Crear un cargo en una cofradía
   */
  crearCargo: async ({ cofradiaId, nombre }: CrearCargoInput) => {
    // 1️⃣ La cofradía debe existir y admitir cambios
    await obtenerCofradiaEditable(cofradiaId);

    // 2️⃣ El nombre debe estar libre
    const existe = await prisma.cargo.findFirst({ where: { cofradiaId, nombre } });
    asegurarNombreLibre(existe, nombre, "cargo");

    // 3️⃣ Crear cargo
    return await prisma.cargo.create({
      data: { cofradiaId, nombre },
    });
  },

  /**
   * Listar cargos de una cofradía
   */
  listCargosByCofradia: async (cofradiaId: number) => {
    // Antes este catch envolvía todo en un Error genérico y perdía el
    // error real de Prisma. Ahora deja que lo traduzca errorHandler.
    return await prisma.cargo.findMany({
      where: { cofradiaId },
      orderBy: { nombre: "asc" },
    });
  },

  /**
   * Editar un cargo
   */
  editarCargo: async ({ cargoId, nombre }: EditarCargoInput) => {
    // 1️⃣ Buscar cargo con su cofradía
    const cargo = await prisma.cargo.findUnique({
      where: { id: cargoId },
      include: { cofradia: true },
    });

    if (!cargo) throw new AppError("CARGO_NOT_FOUND");

    // 2️⃣ Cofradía abierta
    if (cargo.cofradia.estado !== "ABIERTA") throw new AppError("COFRADIA_CERRADA");

    // 3️⃣ Comprobar duplicado, excluyendo el propio cargo
    const existe = await prisma.cargo.findFirst({
      where: { cofradiaId: cargo.cofradiaId, nombre, NOT: { id: cargoId } },
    });
    asegurarNombreLibre(existe, nombre, "cargo");

    // 4️⃣ Actualizar
    return await prisma.cargo.update({ where: { id: cargoId }, data: { nombre } });
  },

  /**
   * Borrar un cargo
   */
  borrarCargo: async (cargoId: number) => {
    // 1️⃣ Buscar cargo + cofradía
    const cargo = await prisma.cargo.findUnique({
      where: { id: cargoId },
      include: { cofradia: true },
    });

    if (!cargo) throw new AppError("CARGO_NOT_FOUND");

    // 2️⃣ Cofradía abierta
    if (cargo.cofradia.estado !== "ABIERTA") throw new AppError("COFRADIA_CERRADA");

    // 3️⃣ Borrar
    await prisma.cargo.delete({ where: { id: cargoId } });
  },
};
