import { afterAll } from "@jest/globals";
import { prisma } from "../../src/config/prismaClient.ts";

/**
 * Cierra la conexión de Prisma al terminar cada fichero de test.
 * Sin esto Jest avisa de que un worker no ha podido salir limpiamente.
 */
afterAll(async () => {
  await prisma.$disconnect();
});