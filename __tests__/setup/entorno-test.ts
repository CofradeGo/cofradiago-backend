import "dotenv/config";
import dotenv from "dotenv";

// En local, .env.test define TEST_DATABASE_URL para usar una base
// apartada. En CI no existe y se usa directamente DATABASE_URL.
dotenv.config({ path: ".env.test" });

const { urlBaseDeTest } = await import("../../src/config/baseDeTest.ts");

/**
 * Entorno de los tests.
 *
 * Se carga antes que cualquier módulo del proyecto, así que fija
 * DATABASE_URL a la base de tests. `dotenv/config` no sobreescribe
 * variables ya definidas, de ahí que este setup tenga que ir el
 * primero.
 */
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = urlBaseDeTest();
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "secreto_de_test_no_usar_en_produccion";