/**
 * Entorno de los tests.
 *
 * Se carga antes que cualquier módulo del proyecto. Fija DATABASE_URL
 * a la base de tests para que `dotenv/config` (que no sobreescribe
 * variables ya definidas) no tire de la base de desarrollo.
 */
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/cofradiago_test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "secreto_de_test_no_usar_en_produccion";