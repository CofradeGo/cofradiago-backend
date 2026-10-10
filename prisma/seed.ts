import { Prisma } from "@prisma/client";
import { prisma } from "../src/config/prismaClient.ts";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ===========================
   Logos
   =========================== */

/**
 * Copia el logo de la hermandad desde prisma/assets/logos (versionado en git)
 * a uploads/logos (ignorado por git, igual que los logos que sube el usuario).
 * Así el seed funciona en cualquier máquina recién clonada.
 *
 * El nombre sigue la misma convención que uploadLogoMiddleware ({domain}_logo.ext),
 * para que un logo subido desde la app sobrescriba limpiamente el del seed.
 *
 * @returns la ruta pública del logo, o null si no hay fichero disponible
 */
function instalarLogo(domain: string): string | null {
  const origenDir = path.join(__dirname, "assets", "logos");
  const destinoDir = path.join(process.cwd(), "uploads", "logos");

  const candidatos = [".png", ".webp", ".jpg", ".jpeg"];
  const origen = candidatos
    .map((ext) => path.join(origenDir, `${domain}_logo${ext}`))
    .find((f) => fs.existsSync(f));

  if (!origen) return null;

  fs.mkdirSync(destinoDir, { recursive: true });
  const destino = path.join(destinoDir, path.basename(origen));
  fs.copyFileSync(origen, destino);

  return `/uploads/logos/${path.basename(origen)}`;
}

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
  const numero = 10000000 + indice;
  const letra = "TRWAGMYFPDXBNJZSQVHLCKE"[numero % 23];
  return `${numero}${letra}`;
}

function generarHermanos(
  hermandadId: number,
  cantidad: number,
  apellidoHermandad: string
): Prisma.HermanoCreateManyInput[] {
  const hermanos: Prisma.HermanoCreateManyInput[] = [];

  for (let i = 1; i <= cantidad; i++) {
    const nombre = nombres[i % nombres.length];
    const apellido1 = apellidos[i % apellidos.length];

    hermanos.push({
      hermandadId,
      numeroAntiguedad: i,
      dni: generarDNI(hermandadId * 1000 + i),
      nombre,
      apellidos: `${apellido1} ${apellidoHermandad}`,
      telefono: `6${Math.floor(10000000 + Math.random() * 89999999)}`,
      email: `${nombre.toLowerCase()}.${apellido1.toLowerCase()}.${apellidoHermandad.toLowerCase()}${i}@example.com`,
      direccion: `Calle Real ${i}`,
      fechaNacimiento: new Date(1965 + (i % 35), i % 12, (i % 28) + 1),
      fechaAltaHermandad: new Date(1990 + (i % 30), i % 12, 1),
    });
  }

  return hermanos;
}

/* ===========================
   Catálogos de la procesión
   =========================== */

const CORTEJOS = [
  { nombre: "Cortejo Principal", orden: 1 },
  { nombre: "Cortejo de Acompañamiento", orden: 2 },
];

const PUESTOS = [
  "Puesto de Trono (derecha)",
  "Puesto de Trono (izquierda)",
  "Sostén de Estandarte Mayor",
  "Portaestandarte",
  "Crucero de Guía",
  "Cirio de Honor",
  "Conductor de Procesión",
  "Banda de Cornetas y Tambores",
  "Avisador de la Marcha",
  "Hermanos de Capa",
  "Hermanos con Túnica",
  "Hermanos con Capirote",
  "Suplente de Puesto",
];

const CARGOS = [
  "Diputado Mayor de Gobierno",
  "Diputado Mayor de Orden",
  "Secretario",
  "Tesorero",
  "Mayordomo",
  "Póster de la Cofradía",
];

const INSIGNIAS = [
  { nombre: "Estandarte Mayor", descripcion: "Estandarte principal de la hermandad" },
  { nombre: "Estandarte de la Soledad", descripcion: "Estandarte de la imagen titular" },
  { nombre: "Crucero de Guía", descripcion: "Guía de la procesión" },
  { nombre: "Cirio de Honor", descripcion: "Cirio reservado al hermano de mayor antigüedad" },
  { nombre: "Medallón del Hermano Mayor", descripcion: "Medalla de reconocimiento" },
  { nombre: "Farol Mayor", descripcion: "Farol que abre el cortejo" },
];

const ELEMENTOS_POR_INSIGNIA: Record<string, { tipo: string; cantidad: number }[]> = {
  "Estandarte Mayor": [{ tipo: "vara", cantidad: 1 }, { tipo: "circunferencia", cantidad: 1 }],
  "Estandarte de la Soledad": [{ tipo: "vara", cantidad: 1 }],
  "Crucero de Guía": [{ tipo: "vara", cantidad: 1 }],
  "Cirio de Honor": [{ tipo: "cirio", cantidad: 1 }],
  "Medallón del Hermano Mayor": [{ tipo: "medallon", cantidad: 1 }],
  "Farol Mayor": [{ tipo: "farol", cantidad: 1 }],
};

const TRAMOS: Record<string, string[]> = {
  "Cortejo Principal": [
    "Tramo de la Cruz de Guía",
    "Tramo del Estandarte",
    "Tramo de las Insignias",
    "Tramo del Trono",
    "Tramo de Ceras",
    "Tramo de Capas",
    "Tramo Final",
  ],
  "Cortejo de Acompañamiento": [
    "Tramo de Entrada",
    "Tramo de Cierre",
  ],
};

/* ===========================
   Seed de una cofradía
   =========================== */

async function seedCofradia(
  hermandadId: number,
  nombre: string,
  anio: number,
  estado: "ABIERTA" | "CERRADA"
): Promise<void> {
  const cofradia = await prisma.cofradia.upsert({
    where: { hermandadId_nombre_anio: { hermandadId, nombre, anio } },
    update: { estado },
    create: { hermandadId, nombre, anio, tipo: "Procesión de penitencia", estado },
  });

  // Cortejos
  for (const cortejo of CORTEJOS) {
    const existe = await prisma.cortejo.findFirst({
      where: { cofradiaId: cofradia.id, nombre: cortejo.nombre },
    });
    if (!existe) {
      await prisma.cortejo.create({
        data: { cofradiaId: cofradia.id, nombre: cortejo.nombre, orden: cortejo.orden },
      });
    }
  }

  // Puestos
  const puestosExistentes = await prisma.puesto.count({ where: { cofradiaId: cofradia.id } });
  if (puestosExistentes === 0) {
    await prisma.puesto.createMany({
      data: PUESTOS.map((p) => ({ cofradiaId: cofradia.id, nombre: p })),
    });
  }

  // Cargos
  for (const cargo of CARGOS) {
    await prisma.cargo.upsert({
      where: { cofradiaId_nombre: { cofradiaId: cofradia.id, nombre: cargo } },
      update: {},
      create: { cofradiaId: cofradia.id, nombre: cargo },
    });
  }

  // Insignias + elementos
  for (const insignia of INSIGNIAS) {
    const creada = await prisma.insignia.upsert({
      where: { cofradiaId_nombre: { cofradiaId: cofradia.id, nombre: insignia.nombre } },
      update: { descripcion: insignia.descripcion },
      create: { cofradiaId: cofradia.id, nombre: insignia.nombre, descripcion: insignia.descripcion },
    });

    const elementos = ELEMENTOS_POR_INSIGNIA[insignia.nombre] ?? [];
    const existentes = await prisma.insigniaElemento.count({ where: { insigniaId: creada.id } });
    if (existentes === 0 && elementos.length > 0) {
      await prisma.insigniaElemento.createMany({
        data: elementos.map((e) => ({ insigniaId: creada.id, tipo: e.tipo, cantidad: e.cantidad })),
      });
    }
  }

  // Tramos
  for (const [nombreCortejo, tramos] of Object.entries(TRAMOS)) {
    const cortejo = await prisma.cortejo.findFirst({
      where: { cofradiaId: cofradia.id, nombre: nombreCortejo },
    });
    if (!cortejo) continue;

    for (const [i, tramo] of tramos.entries()) {
      const existe = await prisma.tramo.findFirst({ where: { cofradiaId: cofradia.id, nombre: tramo } });
      if (!existe) {
        await prisma.tramo.create({
          data: { cofradiaId: cofradia.id, cortejoId: cortejo.id, nombre: tramo, orden: i + 1 },
        });
      }
    }
  }
}

/* ===========================
   Seed principal
   =========================== */

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const hermandades = [
    {
      domain: "soledad-sanlucar",
      name: "Soledad Sanlúcar la Mayor",
      usuarios: ["dmg_soledad", "aux1_soledad"],
      apellidoHermandad: "Soledad",
    },
    {
      domain: "angustias-sanlucar",
      name: "Angustias Sanlúcar la Mayor",
      usuarios: ["dmg_angustias", "aux1_angustias"],
      apellidoHermandad: "Angustias",
    },
  ];

  for (const h of hermandades) {
    const logoUrl = instalarLogo(h.domain);
    if (logoUrl) {
      console.log(`✔ Logo instalado para ${h.name} → ${logoUrl}`);
    } else {
      console.log(`⚠ Sin logo para ${h.name} (busca prisma/assets/logos/${h.domain}_logo.*)`);
    }

    const hermandad = await prisma.hermandad.upsert({
      where: { domain: h.domain },
      update: { logoUrl },
      create: {
        name: h.name,
        domain: h.domain,
        officialEmail: "angelcardenasrod@gmail.com",
        logoUrl,
      },
    });

    // Usuarios (upsert por username, con su rol)
    const roles = ["DMG", "AUXILIAR"] as const;
    for (const [i, username] of h.usuarios.entries()) {
      await prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          password: hashedPassword,
          role: roles[i],
          email: "angelcardenasrod@gmail.com",
          hermandadId: hermandad.id,
        },
      });
    }

    // Hermanos
    const existentes = await prisma.hermano.count({ where: { hermandadId: hermandad.id } });
    if (existentes === 0) {
      await prisma.hermano.createMany({
        data: generarHermanos(hermandad.id, 100, h.apellidoHermandad),
        skipDuplicates: true,
      });
      console.log(`✔ 100 hermanos creados para ${h.name}`);
    } else {
      console.log(`• ${existentes} hermanos ya existentes en ${h.name}`);
    }

    // Cofradías: histórico + año en curso
    const anios: { anio: number; estado: "ABIERTA" | "CERRADA" }[] = [
      { anio: 2025, estado: "CERRADA" },
      { anio: 2026, estado: "CERRADA" },
      { anio: 2027, estado: "ABIERTA" },
    ];

    for (const { anio, estado } of anios) {
      await seedCofradia(hermandad.id, `${h.name} ${anio}`, anio, estado);
    }
    console.log(`✔ ${anios.length} cofradías creadas para ${h.name}`);
  }

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