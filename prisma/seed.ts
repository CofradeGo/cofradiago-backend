import {prisma} from "../src/config/prismaClient";

async function main() {
  console.log("Seeding database...");

  const testData = [
    { name: "Prueba 1" },
    { name: "Prueba 2" },
    { name: "Prueba 3" },
  ];

  for (const data of testData) {
    await prisma.test.create({ data });
  }

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
