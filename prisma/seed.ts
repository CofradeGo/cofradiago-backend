import { prisma } from "../src/config/prismaClient"; // Ajusta según tu path
import bcrypt from "bcrypt";

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  // ===========================
  // Hermandad Soledad
  // ===========================
  const soledad = await prisma.hermandad.upsert({
    where: { domain: "soledad-sanlucar" },
    update: {},
    create: {
      name: "Soledad Sanlúcar la Mayor",
      domain: "soledad-sanlucar",
      officialEmail: "angelcardenasrod@gmail.com",
      logoUrl: "/uploads/logos/soledad.png",
      users: {
        create: [
          { username: "dmg_soledad", password: hashedPassword, role: "DMG", email: "angelcardenasrod@gmail.com" },
          { username: "aux1_soledad", password: hashedPassword, role: "AUXILIAR", email: "angelcardenasrod@gmail.com" },
        ],
      },
    },
  });
  console.log(`Hermandad creada o verificada: ${soledad.name}`);

  // Crear hermanos para Soledad (si no existen)
  await prisma.hermano.createMany({
    data: [
      {
        hermandadId: soledad.id,
        numeroAntiguedad: 1,
        nombre: "Juan",
        apellidos: "Pérez",
        telefono: "600111222",
        email: "juan.perez@example.com",
        direccion: "Calle Falsa 123",
        fechaNacimiento: new Date("1980-05-15"),
        fechaAltaHermandad: new Date("2000-03-01"),
      },
      {
        hermandadId: soledad.id,
        numeroAntiguedad: 2,
        nombre: "María",
        apellidos: "García",
        telefono: "600333444",
        email: "maria.garcia@example.com",
        direccion: "Avenida Siempre Viva 45",
        fechaNacimiento: new Date("1985-09-20"),
        fechaAltaHermandad: new Date("2005-06-10"),
      },
    ],
    skipDuplicates: true, // Evita error si el hermano ya existe
  });

  // ===========================
  // Hermandad Angustias
  // ===========================
  const angustias = await prisma.hermandad.upsert({
    where: { domain: "angustias-sanlucar" },
    update: {},
    create: {
      name: "Angustias Sanlúcar la Mayor",
      domain: "angustias-sanlucar",
      officialEmail: "angelcardenasrod@gmail.com",
      logoUrl: "/uploads/logos/angustias.png",
      users: {
        create: [
          { username: "dmg_angustias", password: hashedPassword, role: "DMG", email: "angelcardenasrod@gmail.com" },
          { username: "aux1_angustias", password: hashedPassword, role: "AUXILIAR", email: "angelcardenasrod@gmail.com" },
        ],
      },
    },
  });
  console.log(`Hermandad creada o verificada: ${angustias.name}`);

  // Crear hermanos para Angustias (si no existen)
  await prisma.hermano.createMany({
    data: [
      {
        hermandadId: angustias.id,
        numeroAntiguedad: 1,
        nombre: "Pedro",
        apellidos: "López",
        telefono: "600555666",
        email: "pedro.lopez@example.com",
        direccion: "Calle Luna 7",
        fechaNacimiento: new Date("1975-11-02"),
        fechaAltaHermandad: new Date("1995-04-15"),
      },
      {
        hermandadId: angustias.id,
        numeroAntiguedad: 2,
        nombre: "Laura",
        apellidos: "Martínez",
        telefono: "600777888",
        email: "laura.martinez@example.com",
        direccion: "Plaza Sol 10",
        fechaNacimiento: new Date("1990-02-18"),
        fechaAltaHermandad: new Date("2010-08-20"),
      },
    ],
    skipDuplicates: true,
  });

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
