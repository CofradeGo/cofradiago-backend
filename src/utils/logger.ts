/**
 * Logger mínimo y estructurado.
 *
 * Sustituye a los `console.error` sueltos por dos motivos:
 *  - en producción escribe JSON (una línea por evento, parseable);
 *  - en desarrollo escribe algo legible.
 *
 * No añade dependencias: si más adelante necesitáis pino/winston, este
 * módulo es el único punto que habría que tocar.
 */

type Nivel = "debug" | "info" | "warn" | "error";

const NIVELES: Record<Nivel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const esProduccion = process.env.NODE_ENV === "production";
const minimo: number = NIVELES[(process.env.LOG_LEVEL as Nivel) ?? (esProduccion ? "info" : "debug")];

const COLORES: Record<Nivel, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

/** Serializa un error para que no se pierda en un JSON.stringify. */
const serializar = (valor: unknown): unknown => {
  if (valor instanceof Error) {
    return { name: valor.name, message: valor.message, stack: valor.stack };
  }
  return valor;
};

function emitir(nivel: Nivel, mensaje: string, contexto?: Record<string, unknown>) {
  if (NIVELES[nivel] < minimo) return;

  const datos = { ...contexto };
  for (const [clave, valor] of Object.entries(datos)) {
    if (serializar(valor) !== valor) datos[clave] = serializar(valor);
  }

  if (esProduccion) {
    // Una línea JSON por evento: lo que esperan los agregadores de logs.
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), nivel, mensaje, ...datos }));
    return;
  }

  const sufijo = Object.keys(datos).length ? ` ${JSON.stringify(datos)}` : "";
  // eslint-disable-next-line no-console
  console.log(`${COLORES[nivel]}${nivel.toUpperCase().padEnd(5)}${RESET} ${mensaje}${sufijo}`);
}

export const logger = {
  debug: (mensaje: string, contexto?: Record<string, unknown>) => emitir("debug", mensaje, contexto),
  info: (mensaje: string, contexto?: Record<string, unknown>) => emitir("info", mensaje, contexto),
  warn: (mensaje: string, contexto?: Record<string, unknown>) => emitir("warn", mensaje, contexto),
  error: (mensaje: string, contexto?: Record<string, unknown>) => emitir("error", mensaje, contexto),
};