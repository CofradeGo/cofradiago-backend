/**
 * Prepara la base de datos de tests antes de lanzar Jest.
 *
 * `DATABASE_URL` es la única fuente de verdad: tanto si apunta a la
 * base de desarrollo (en local) como a la que define el CI. El script
 * se deduce de ahí en vez de fijar credenciales, que es lo que lo
 * rompía en GitHub Actions.
 *
 * En el CI la base ya existe, así que no hace falta nada de este
 * fichero; en local (Postgres.app) se crea la primera vez.
 */
import "dotenv/config";
import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { nombreBaseDeTest, urlBaseDeTest } from "../src/config/baseDeTest.ts";

// .env.test define TEST_DATABASE_URL en local; no existe en CI, que usa
// directamente DATABASE_URL.
dotenv.config({ path: ".env.test" });

const BASE_DATOS_MAESTRA = "postgres";

const urlBase = urlBaseDeTest();
const NOMBRE_TEST_DB = nombreBaseDeTest();

/** Misma conexión pero contra la base maestra, que es la única que
 *  permite ejecutar CREATE DATABASE. */
const urlAdmina = (() => {
  const u = new URL(urlBase);
  u.pathname = `/${BASE_DATOS_MAESTRA}`;
  return u.toString();
})();

/** ¿Podemos conectarnos ya a la base de tests? */
async function baseDeTestAccesible(): Promise<boolean> {
  const cliente = new PrismaClient({
    adapter: new PrismaPg({ connectionString: urlBase }),
  });
  try {
    await cliente.$queryRawUnsafe("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await cliente.$disconnect();
  }
}

/** Crea la base de tests si no existe todavía. */
async function crearBaseSiNoExiste(): Promise<void> {
  if (await baseDeTestAccesible()) {
    console.log(`ℹ️  Base de tests ya disponible: ${NOMBRE_TEST_DB}`);
    return;
  }

  console.log(`⚠️  No se puede conectar a "${NOMBRE_TEST_DB}"; se intentará crearla.`);

  const admin = new PrismaClient({
    adapter: new PrismaPg({ connectionString: urlAdmina }),
  });

  try {
    const existe = await admin.$queryRawUnsafe(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      NOMBRE_TEST_DB
    );

    if (existe.length > 0) {
      console.error(
        `❌ La base "${NOMBRE_TEST_DB}" existe pero no se puede conectar.\n` +
          "   Revisa las credenciales de DATABASE_URL."
      );
      process.exit(1);
    }

    // Identificador entrecomillado; viene de nuestra propia configuración.
    await admin.$executeRawUnsafe(`CREATE DATABASE "${NOMBRE_TEST_DB}"`);
    console.log(`✅ Base de tests creada: ${NOMBRE_TEST_DB}`);
  } catch (error) {
    console.error(
      `❌ No se pudo crear "${NOMBRE_TEST_DB}".\n` +
        `   Conectando a ${BASE_DATOS_MAESTRA} como "${url.username}".\n` +
        "   En Docker basta con levantar el servicio; en Postgres.app,\n" +
        "   usa la misma contraseña que tenga el rol.",
      error
    );
    process.exit(1);
  } finally {
    await admin.$disconnect();
  }
}

/** Ejecuta un comando contra la base de tests. */
function ejecutar(comando: string, args: string[]): void {
  const resultado = spawnSync(comando, args, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: urlBase, NODE_ENV: "test" },
  });

  if (resultado.status !== 0) {
    console.error(`❌ Falló: ${comando} ${args.join(" ")}`);
    process.exit(resultado.status ?? 1);
  }
}

async function main() {
  await crearBaseSiNoExiste();
  ejecutar("npx", ["prisma", "migrate", "deploy"]);
  ejecutar("node", ["prisma/seed.ts"]);
  console.log("✅ Base de datos de tests lista");
}

main().catch((error) => {
  console.error("❌ No se pudo preparar la base de tests:", error);
  process.exit(1);
});