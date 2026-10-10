import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { isAppError } from "../errors/AppError.ts";
import { entorno } from "../config/entorno.ts";
import { logger } from "../utils/logger.ts";

/**
 * 404 para rutas no registradas.
 * Se monta justo antes del manejador de errores.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: "ROUTE_NOT_FOUND",
    message: `No existe el endpoint ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Manejador central de errores.
 *
 * Sustituye a los 25 `switch (error.message)` que estaban repetidos en
 * los controllers: aquí se decide el status una sola vez y se garantiza
 * que ningún detalle interno se filtre al cliente en producción.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // 1. Errores de validación de Zod
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Los datos enviados no son válidos",
      detalles: error.issues.map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      })),
    });
  }

  // 2. Errores de dominio
  if (isAppError(error)) {
    return res.status(error.status).json({
      error: error.code,
      message: error.message,
    });
  }

  // 3. Cualquier otra cosa es un fallo nuestro: 500.
  //    Fuera de desarrollo no se muestra el mensaje real.
  logger.error("Error no controlado", { error });

  return res.status(500).json({
    error: "INTERNAL_ERROR",
    message: entorno.exponerErrores
      ? (error as Error)?.message ?? "Error interno del servidor"
      : "Error interno del servidor",
  });
};