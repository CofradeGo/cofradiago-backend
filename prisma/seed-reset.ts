// prisma/seed-reset.ts
import { prisma } from "../src/config/prismaClient";

async function main() {
  console.log("Cleaning seeded data...");

  // Borrar todos los usuarios primero (por dependencia)
  await prisma.user.deleteMany({});

  // Borrar todas las hermandades
  await prisma.hermandad.deleteMany({});

  console.log("Database cleaned!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
