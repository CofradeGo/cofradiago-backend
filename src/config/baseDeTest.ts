/**
 * Resuelve qué base de datos usan los tests.
 *
 * Regla única, compartida por el script que prepara la base y por el
 * setup de Jest, para que nunca se desincronicen:
 *
 *   1. TEST_DATABASE_URL si está definida (.env.test en local)
 *   2. DATABASE_URL tal cual — así en CI, donde el servicio de
 *      Postgres ya crea la base y no hay nada que inventar
 *
 * Sin esto los tests en local tocarían la base de desarrollo.
 */

export const urlBaseDeTest = (): string => {
  const url = (process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "").split("?")[0];

  if (!url) {
    throw new Error(
      "No hay base de datos para los tests. Define TEST_DATABASE_URL en .env.test " +
        "o DATABASE_URL en el entorno."
    );
  }

  return url;
};

/** Nombre de la base, sin el esquema. */
export const nombreBaseDeTest = (): string =>
  decodeURIComponent(new URL(urlBaseDeTest()).pathname.slice(1));