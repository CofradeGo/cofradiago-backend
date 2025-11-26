 import { prisma } from "../src/config/prismaClient"; // Ajusta según tu path

async function main() {
  console.log("Seeding database...");

  // Hermandad Soledad
  const soledad = await prisma.hermandad.create({
    data: {
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
  });
  console.log(`Hermandad creada: ${soledad.name}`);

  // Hermandad Angustias
  const angustias = await prisma.hermandad.create({
    data: {
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
  });
  console.log(`Hermandad creada: ${angustias.name}`);

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
