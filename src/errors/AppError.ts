/**
 * Sistema de errores de la aplicación.
 *
 * Antes los controllers comparaban `error.message` contra cadenas
 * mágicas ("COFRADIA_NOT_FOUND") para decidir el status HTTP, y esos
 * `switch` estaban duplicados en 10 ficheros. Aquí el código, su
 * status y su mensaje para el usuario viven en un único sitio.
 */

/** Catálogo de errores de dominio: código → status HTTP + mensaje. */
export const ERROR_CATALOG = {
  // ── 404 · No encontrado ────────────────────────────────────────
  COFRADIA_NOT_FOUND: { status: 404, message: "La cofradía no existe" },
  CORTEJO_NOT_FOUND: { status: 404, message: "El cortejo no existe" },
  TRAMO_NOT_FOUND: { status: 404, message: "El tramo no existe" },
  PUESTO_NOT_FOUND: { status: 404, message: "El puesto no existe" },
  INSIGNIA_NOT_FOUND: { status: 404, message: "La insignia no existe" },
  ELEMENTO_NOT_FOUND: { status: 404, message: "El elemento no existe" },
  CARGO_NOT_FOUND: { status: 404, message: "El cargo no existe" },
  HERMANDAD_NOT_FOUND: { status: 404, message: "La hermandad no existe" },
  USER_NOT_FOUND: { status: 404, message: "El usuario no existe" },

  // ── 403 · Sin permiso ──────────────────────────────────────────
  ACCESS_DENIED: { status: 403, message: "No tienes permisos para esta acción" },
  NO_PERMISSION: { status: 403, message: "No tienes permisos para esta acción" },
  FORBIDDEN_ACTION: { status: 403, message: "No se puede realizar esta acción" },
  FORBIDDEN: { status: 403, message: "Acceso prohibido" },
  CANNOT_DELETE_SELF: { status: 403, message: "No puedes desactivar tu propio usuario" },

  // ── 409 · Conflicto de estado ──────────────────────────────────
  COFRADIA_CERRADA: { status: 409, message: "La cofradía está cerrada y no admite cambios" },
  NOMBRE_DUPLICADO: { status: 409, message: "Ya existe un registro con ese nombre" },

  // ── 400 · Petición inválida ────────────────────────────────────
  // 400 y no 401 a propósito: el interceptor de axios del frontend
  // refresca el token ante cualquier 401. Mantener el login en 400
  // evita que un intento fallido dispare un refresco inútil.
  INVALID_CREDENTIALS: { status: 400, message: "Usuario o contraseña incorrectos" },
  HERMANDAD_NOT_IN_DOMAIN: { status: 400, message: "El usuario no pertenece a esta hermandad" },
  CORTEJO_NOT_BELONG_TO_COFRADIA: { status: 400, message: "El cortejo no pertenece a la cofradía" },
  TRAMO_NOT_BELONG_TO_COFRADIA: { status: 400, message: "El tramo no pertenece a la cofradía" },
  TRAMO_NOT_BELONG_TO_CORTEJO: { status: 400, message: "El tramo no pertenece al cortejo" },
  ORDENES_INVALIDOS: { status: 400, message: "La lista de orden recibida no es válida" },
  ESTADO_INVALIDO: { status: 400, message: "El estado indicado no es válido" },
  INSIGNIA_NOT_BELONG_TO_COFRADIA: { status: 400, message: "La insignia no pertenece a la cofradía" },
  INVALID_OR_EXPIRED_TOKEN: { status: 400, message: "El enlace no es válido o ha caducado" },
  INVALID_OLD_PASSWORD: { status: 401, message: "La contraseña actual no es correcta" },
  WEAK_PASSWORD: { status: 400, message: "La contraseña no cumple los requisitos mínimos" },
  USER_INACTIVE: { status: 403, message: "El usuario está desactivado" },
  INVALID_REFRESH_TOKEN: { status: 401, message: "El token de refresco no es válido o ha caducado" },
  REFRESH_TOKEN_REQUIRED: { status: 401, message: "Falta el token de refresco" },
  NO_VALID_FIELDS: { status: 400, message: "No se han indicado campos para actualizar" },
  NO_FIELDS_TO_UPDATE: { status: 400, message: "No hay cambios que guardar" },
  PASSWORD_FIELDS_REQUIRED: { status: 400, message: "La contraseña actual y la nueva son obligatorias" },
} as const;

export type ErrorCode = keyof typeof ERROR_CATALOG;

/**
 * Error de la aplicación con código de dominio y status HTTP asociado.
 * Los services lanzan estos errores; el middleware central los traduce
 * a una respuesta JSON. Cualquier otro error se trata como 500.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, options?: { message?: string | undefined; cause?: unknown }) {
    const catalogo = ERROR_CATALOG[code];
    super(options?.message ?? catalogo.message, { cause: options?.cause });

    this.name = "AppError";
    this.code = code;
    this.status = catalogo.status;

    // Mantiene el prototipo correcto aunque se compile a ES5
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** Cuerpo que ve el cliente. `error` conserva el código, `message` el texto. */
  toJSON() {
    return { error: this.code, message: this.message };
  }
}

/** Azúcar sintáctico: `throw notFound("COFRADIA_NOT_FOUND")`. */
export const notFound = (code: ErrorCode, message?: string) => new AppError(code, { message });
export const badRequest = (code: ErrorCode, message?: string) => new AppError(code, { message });
export const forbidden = (code: ErrorCode, message?: string) => new AppError(code, { message });
export const conflict = (code: ErrorCode, message?: string) => new AppError(code, { message });

/** Identifica errores de la aplicación sin depender de `instanceof`. */
export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError ||
  (typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "status" in error &&
    (error as AppError).name === "AppError");