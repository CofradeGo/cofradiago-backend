import { prisma } from "../../src/config/prismaClient.ts";

/**
 * Cierra la conexión de Prisma al terminar la ejecución entera.
 *
 * Estaba en un `afterAll` de cada fichero, y eso no funciona con
 * `--runInBand`: todos los ficheros comparten el mismo proceso, así que
 * a partir del primero la conexión quedaba cerrada y cada uso posterior
 * de Prisma tenía que reconectar. Con muchas peticiones seguidas eso
 * acaba en un `ECONNRESET` que no es de la aplicación sino del hueco de
 * la reconexión.
 *
 * Cerrar una vez al final hace que la conexión dure lo mismo que dura la
 * ejecución, que es justo lo que se quiere.
 */
export default async function teardown() {
  await prisma.$disconnect();
}
