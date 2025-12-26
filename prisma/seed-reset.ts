// prisma/seed-reset.ts
import { prisma } from "../src/config/prismaClient";

async function main() {
  console.log("🧹 Cleaning seeded data...");

  // Tokens (dependen de User)
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});

  // Hermanos (dependen de Hermandad)
  await prisma.hermano.deleteMany({});

  // Usuarios (dependen de Hermandad)
  await prisma.user.deleteMany({});

  // Hermandades (tabla raíz)
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
