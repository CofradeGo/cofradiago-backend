import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { entorno } from "./entorno.ts";

/**
 * Cliente de Prisma único para toda la aplicación.
 *
 * En tests no se registran las queries: cada una ensucia la salida de
 * Jest y no aporta nada (el error ya se ve en el propio aserto).
 */
const adapter = new PrismaPg({ connectionString: entorno.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log:
    entorno.NODE_ENV === "test"
      ? ["warn", "error"]
      : ["query", "info", "warn", "error"],
});