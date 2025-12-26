import { Prisma } from "@prisma/client";
import { prisma } from "../src/config/prismaClient";
import bcrypt from "bcrypt";

/* ===========================
   Datos realistas
=========================== */

const nombres = [
  "Juan", "Antonio", "Manuel", "Francisco", "José",
  "David", "Carlos", "Daniel", "Miguel", "Rafael",
  "María", "Carmen", "Ana", "Isabel", "Laura",
  "Lucía", "Marta", "Cristina", "Elena", "Patricia",
];

const apellidos = [
  "García", "Pérez", "López", "Martínez", "Sánchez",
  "Rodríguez", "Fernández", "Gómez", "Ruiz", "Díaz",
  "Moreno", "Álvarez", "Muñoz", "Romero", "Navarro",
];

function generarDNI(indice: number): string {
  // Usamos el índice para garantizar DNIs únicos en el seed
  const numero = 10000000 + indice;
  const letra = "TRWAGMYFPDXBNJZSQVHLCKE"[numero % 23];
  return `${numero}${letra}`;
}


function generarHermanos(
  hermandadId: number,
  cantidad: number,
  apellidoHermandad: "Soledad" | "Angustias"
): Prisma.HermanoCreateManyInput[] {

  const hermanos: Prisma.HermanoCreateManyInput[] = [];

  for (let i = 1; i <= cantidad; i++) {
    const nombre = nombres[i % nombres.length];
    const apellido1 = apellidos[i % apellidos.length];

    hermanos.push({
      hermandadId,
      numeroAntiguedad: i,
      dni: generarDNI(hermandadId * 1000 + i), // 🔐 DNI único y válido
      nombre,
      apellidos: `${apellido1} ${apellidoHermandad}`,
      telefono: `6${Math.floor(10000000 + Math.random() * 89999999)}`,
      email: `${nombre.toLowerCase()}.${apellido1.toLowerCase()}.${apellidoHermandad.toLowerCase()}${i}@example.com`,
      direccion: `Calle Real ${i}`,
      fechaNacimiento: new Date(
        1965 + (i % 35),
        i % 12,
        (i % 28) + 1
      ),
      fechaAltaHermandad: new Date(
        1990 + (i % 30),
        i % 12,
        1
      ),
    });
  }

  return hermanos;
}


/* ===========================
   Seed principal
=========================== */

async function main() {
  console.log("🌱 Seeding database...");

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
          {
            username: "dmg_soledad",
            password: hashedPassword,
            role: "DMG",
            email: "angelcardenasrod@gmail.com",
          },
          {
            username: "aux1_soledad",
            password: hashedPassword,
            role: "AUXILIAR",
            email: "angelcardenasrod@gmail.com",
          },
        ],
      },
    },
  });

  await prisma.hermano.createMany({
    data: generarHermanos(soledad.id, 100, "Soledad"),
    skipDuplicates: true,
  });

  console.log("✔ 100 hermanos creados para Soledad");

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
          {
            username: "dmg_angustias",
            password: hashedPassword,
            role: "DMG",
            email: "angelcardenasrod@gmail.com",
          },
          {
            username: "aux1_angustias",
            password: hashedPassword,
            role: "AUXILIAR",
            email: "angelcardenasrod@gmail.com",
          },
        ],
      },
    },
  });

  await prisma.hermano.createMany({
    data: generarHermanos(angustias.id, 100, "Angustias"),
    skipDuplicates: true,
  });

  console.log("✔ 100 hermanos creados para Angustias");

  console.log("✅ Seeding finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
