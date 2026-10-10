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