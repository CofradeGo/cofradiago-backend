/**
 * Prepara la base de datos de tests antes de lanzar Jest.
 *
 * Crea la base `cofradiago_test` si no existe, aplica las migraciones
 * y la siembra. Se ejecuta desde `npm test` para que en local y en CI
 * la base esté siempre en el mismo estado.
 */
import { spawnSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const ADMIN_DATABASE_URL =
  process.env.TEST_ADMIN_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/postgres";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/cofradiago_test";

const NOMBRE_TEST_DB = new URL(TEST_DATABASE_URL).pathname.slice(1);

/** Crea la base de tests si no existe todavía. */
async function crearBaseSiNoExiste(): Promise<void> {
  const admin = new PrismaClient({
    adapter: new PrismaPg({ connectionString: ADMIN_DATABASE_URL }),
  });

  try {
    const existe = await admin.$queryRawUnsafe(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      NOMBRE_TEST_DB
    );

    if (existe.length > 0) {
      console.log(`ℹ️  Base de tests ya existe: ${NOMBRE_TEST_DB}`);
      return;
    }

    // Identificador con comillas por seguridad; viene de nuestra propia config.
    await admin.$executeRawUnsafe(`CREATE DATABASE "${NOMBRE_TEST_DB}"`);
    console.log(`✅ Base de tests creada: ${NOMBRE_TEST_DB}`);
  } finally {
    await admin.$disconnect();
  }
}

/** Ejecuta un comando heredando el DATABASE_URL de tests. */
function ejecutar(comando: string, args: string[]): void {
  const resultado = spawnSync(comando, args, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, NODE_ENV: "test" },
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