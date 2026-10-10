import "dotenv/config";
import { z } from "zod";

/**
 * Configuración de la aplicación, validada al arrancar.
 *
 * Antes cada módulo leía `process.env` por su cuenta y comprobaba lo
 * que necesitara. Si faltaba una variable, el fallo aparecía a mitad
 * de una petición, no al arrancar. Con Zod falla todo junto y con un
 * mensaje que dice qué variable falta.
 */

const esquema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL no puede estar vacía")
    .refine((v) => v.startsWith("postgresql://"), {
      message: "DATABASE_URL debe ser una URL de PostgreSQL",
    }),

  JWT_SECRET: z.string().min(16, "JWT_SECRET debe tener al menos 16 caracteres"),

  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  APP_URL: z.string().url().default("http://localhost:3000"),
});

const resultado = esquema.safeParse(process.env);

if (!resultado.success) {
  const detalle = resultado.error.issues
    .map((i) => `  · ${i.path.join(".") || "(raíz)"}: ${i.message}`)
    .join("\n");

  throw new Error(
    `Configuración de entorno inválida:\n${detalle}\n\n` +
      "Revisa tu .env o copia .env.example."
  );
}

const valores = resultado.data;

export const entorno = {
  ...valores,
  /** Muestra el mensaje real de los errores 500. Nunca en producción. */
  exponerErrores: valores.NODE_ENV !== "production",
} as const;

export const PORT = entorno.PORT;
export const DATABASE_URL = entorno.DATABASE_URL;
export const JWT_SECRET = entorno.JWT_SECRET;
export const FRONTEND_URL = entorno.FRONTEND_URL;
export const APP_URL = entorno.APP_URL;