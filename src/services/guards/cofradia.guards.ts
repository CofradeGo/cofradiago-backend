import { prisma } from "../../config/prismaClient.ts";
import { AppError } from "../../errors/AppError.ts";

/**
 * Guards compartidos por los servicios de la cofradía.
 *
 * Antes cada servicio repetía a mano las mismas tres comprobaciones
 * (existe, está abierta, no está duplicado). Aquí viven una vez.
 */

/**
 * Devuelve la cofradía o lanza si no existe.
 * @throws AppError COFRADIA_NOT_FOUND
 */
export async function obtenerCofradia(cofradiaId: number) {
  const cofradia = await prisma.cofradia.findUnique({
    where: { id: cofradiaId },
  });

  if (!cofradia) throw new AppError("COFRADIA_NOT_FOUND");

  return cofradia;
}

/**
 * Devuelve la cofradía comprobando además que admita cambios.
 *
 * @throws AppError COFRADIA_NOT_FOUND | COFRADIA_CERRADA
 */
export async function obtenerCofradiaEditable(cofradiaId: number) {
  const cofradia = await obtenerCofradia(cofradiaId);

  if (cofradia.estado !== "ABIERTA") throw new AppError("COFRADIA_CERRADA");

  return cofradia;
}

/**
 * Lanza si ya existe un registro con ese nombre en la cofradía.
 *
 * @param existe  resultado de la consulta de duplicados
 * @param nombre  nombre que se está creando o renombrando
 * @param entidad "cargo", "puesto"... para el mensaje
 * @throws AppError NOMBRE_DUPLICADO
 */
export function asegurarNombreLibre(
  existe: unknown,
  nombre: string,
  entidad: string
): void {
  if (existe) {
    throw new AppError("NOMBRE_DUPLICADO", {
      message: `Ya existe un ${entidad} con el nombre "${nombre}" en esta cofradía`,
    });
  }
}

/**
 * Verifica que un recurso pertenece a la cofradía esperada.
 * Evita que alguien pase un id de otra hermandad.
 */
export function asegurarPertenencia<T extends { cofradiaId: number }>(
  recurso: T | null,
  cofradiaId: number,
  recursoNoEncontrado: "PUESTO_NOT_FOUND" | "INSIGNIA_NOT_FOUND" | "TRAMO_NOT_FOUND",
  noPertenece:
    | "INSIGNIA_NOT_BELONG_TO_COFRADIA"
    | "TRAMO_NOT_BELONG_TO_COFRADIA"
    | "CORTEJO_NOT_BELONG_TO_COFRADIA"
): T {
  if (!recurso) throw new AppError(recursoNoEncontrado);
  if (recurso.cofradiaId !== cofradiaId) throw new AppError(noPertenece);

  return recurso;
}

/**
 * Valida la lista de ids que llega al reordenar un listado.
 *
 * El cliente manda los ids ya en el orden que quiere, y el servidor
 * les asigna la posición 1..n. Se exige que la lista sea una
 * permutación exacta de lo que hay guardado: si falta un elemento o
 * sobra uno, aplicarla dejaría huecos o duplicados en `orden` sin que
 * nadie se entere, y el siguiente listado saldría descoyuntado.
 *
 * @param guardados  ids actualmente guardados, en orden
 * @param recibidos  ids que manda el cliente, ya ordenados
 * @throws AppError ORDENES_INVALIDOS
 */
export function asegurarListaDeOrdenValida(
  guardados: number[],
  recibidos: number[],
): void {
  if (!Array.isArray(recibidos) || recibidos.length === 0) {
    throw new AppError("ORDENES_INVALIDOS");
  }

  if (recibidos.length !== guardados.length) {
    throw new AppError("ORDENES_INVALIDOS", {
      message: `Se esperaban ${guardados.length} elementos en el orden y se han recibido ${recibidos.length}. Vuelve a cargar la lista e inténtalo de nuevo.`,
    });
  }

  const unicos = new Set(recibidos);
  const cubreTodos = guardados.every((id) => unicos.has(id));

  if (unicos.size !== recibidos.length || !cubreTodos) {
    throw new AppError("ORDENES_INVALIDOS", {
      message:
        "La lista de orden no coincide con los elementos guardados. Vuelve a cargar la lista e inténtalo de nuevo.",
    });
  }
}