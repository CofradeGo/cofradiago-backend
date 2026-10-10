// prisma/seed-reset.ts
import { prisma } from "../src/config/prismaClient.ts";

async function main() {
  console.log("🧹 Cleaning seeded data...");

  // Tokens (dependen de User)
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});

  // Elementos de insignia (dependen de Insignia)
  await prisma.insigniaElemento.deleteMany({});

  // Tablas dependientes de Cofradia
  await prisma.tramo.deleteMany({});
  await prisma.puesto.deleteMany({});
  await prisma.cargo.deleteMany({});
  await prisma.cortejo.deleteMany({});
  await prisma.insignia.deleteMany({});
  await prisma.cofradia.deleteMany({});

  // Hermanos y Usuarios (dependen de Hermandad)
  await prisma.hermano.deleteMany({});
  await prisma.user.deleteMany({});

  // Hermandad (tabla raíz)
  await prisma.hermandad.deleteMany({});

  console.log("✅ Database cleaned successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error cleaning database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });