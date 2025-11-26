import { prisma } from "../src/config/prismaClient"; // Ajusta según tu path

async function main() {
  console.log("Seeding database...");

  // Hermandad Soledad
  const soledad = await prisma.hermandad.upsert({
    where: { domain: "soledad.com" },
    update: {}, // no hace nada si ya existe
    create: {
      name: "Soledad",
      domain: "soledad.com",
      officialEmail: "angelcardenasrod@gmail.com",
      users: {
        create: [
          {
            username: "dmg_soledad",
            password: "123456", // temporal, luego hasheo
            role: "DMG",
            email: "angelcardenasrod@gmail.com",
          },
          {
            username: "aux1_soledad",
            password: "123456",
            role: "AUXILIAR",
            email: "angelcardenasrod@gmail.com",
          },
        ],
      },
    },
    include: { users: true },
  });
  console.log(`Hermandad creada o verificada: ${soledad.name} con ${soledad.users.length} usuarios`);

  // Hermandad Angustias
  const angustias = await prisma.hermandad.upsert({
    where: { domain: "angustias.com" },
    update: {},
    create: {
      name: "Angustias",
      domain: "angustias.com",
      officialEmail: "angelcardenasrod@gmail.com",
      users: {
        create: [
          {
            username: "dmg_angustias",
            password: "123456",
            role: "DMG",
            email: "angelcardenasrod@gmail.com",
          },
          {
            username: "aux1_angustias",
            password: "123456",
            role: "AUXILIAR",
            email: "angelcardenasrod@gmail.com",
          },
        ],
      },
    },
    include: { users: true },
  });
  console.log(`Hermandad creada o verificada: ${angustias.name} con ${angustias.users.length} usuarios`);

  console.log("Seeding finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
