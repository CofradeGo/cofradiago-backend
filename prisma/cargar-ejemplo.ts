/**
 * Carga el ejemplo de procesión sobre una cofradía.
 *
 *   node prisma/cargar-ejemplo.ts
 *
 * Va aparte del seed habitual porque crea casi doscientas personas y
 * solo sirve para revisar la vista "Ver Cortejos" con datos que tengan
 * forma de procesión real.
 *
 * Respeta la regla que también exige la base de datos: una persona
 * ocupa un solo tramo y un solo puesto en cada cofradía.
 *
 * Variables opcionales: EJEMPLO_DOMINIO y EJEMPLO_ANIO.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { CORTEJO_EJEMPLO, hermanoInventado, TOTAL_EJEMPLO } from "./ejemplo-procesion.ts";

const DOMINIO = process.env.EJEMPLO_DOMINIO ?? "soledad-sanlucar";
const ANIO = Number(process.env.EJEMPLO_ANIO ?? 2027);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }), log: ["error", "warn"] });

// Índices ya usados, para no asignar dos veces a la misma persona.
const ocupados = new Set();

const siguienteLibre = (desde) => {
  for (let i = desde; i < TOTAL_EJEMPLO * 3; i++) {
    if (!ocupados.has(i)) return i;
  }
  return null;
};

const buscarOCrearPuesto = async (cofradiaId, nombre) => {
  const existente = await prisma.puesto.findFirst({ where: { cofradiaId, nombre } });
  if (existente) return existente;
  return prisma.puesto.create({ data: { cofradiaId, nombre } });
};

const buscarOCrearHermano = async (hermandadId, indice) => {
  const numeroAntiguedad = 2000 + indice;
  const existente = await prisma.hermano.findFirst({
    where: { hermandadId, numeroAntiguedad },
  });
  if (existente) return existente;

  const { nombre, apellidos } = hermanoInventado(indice);
  return prisma.hermano.create({
    data: {
      hermandadId,
      numeroAntiguedad,
      nombre,
      apellidos,
      telefono: "600000000",
      email: `ejemplo${indice}@cofradiago.local`,
      direccion: "Sanlúcar la Mayor",
      fechaAltaHermandad: new Date("2024-01-01"),
      activo: true,
    },
  });
};

const main = async () => {
  const hermandad = await prisma.hermandad.findFirst({ where: { domain: DOMINIO } });
  if (!hermandad) throw new Error(`No hay hermandad con el dominio ${DOMINIO}.`);

  const cofradia = await prisma.cofradia.findFirst({
    where: { hermandadId: hermandad.id, anio: ANIO },
  });
  if (!cofradia) throw new Error(`No hay cofradía de ${ANIO} en ${hermandad.name}.`);

  console.log(`Cargando el ejemplo sobre: ${hermandad.name} ${ANIO} (id ${cofradia.id})`);

  // Cortejo
  let cortejo = await prisma.cortejo.findFirst({
    where: { cofradiaId: cofradia.id, nombre: CORTEJO_EJEMPLO.nombre },
  });
  if (!cortejo) {
    cortejo = await prisma.cortejo.create({
      data: { cofradiaId: cofradia.id, nombre: CORTEJO_EJEMPLO.nombre, orden: 1 },
    });
  }

  // Tramos
  const tramos = [];
  for (const [posicion, definicion] of CORTEJO_EJEMPLO.tramos.entries()) {
    const existente = await prisma.tramo.findFirst({
      where: { cortejoId: cortejo.id, nombre: definicion.nombre },
    });

    const tramo = existente
      ? await prisma.tramo.update({ where: { id: existente.id }, data: { orden: posicion + 1 } })
      : await prisma.tramo.create({
          data: {
            cofradiaId: cofradia.id,
            cortejoId: cortejo.id,
            nombre: definicion.nombre,
            orden: posicion + 1,
          },
        });

    tramos.push({ tramo, definicion });
  }
  console.log(`  ${tramos.length} tramos`);

  // Puestos: únicos por cofradía aunque ocupen varios tramos, que es
  // lo que hace que "Cirios" sea una sola entrada ligada a cinco tramos.
  const puestos = new Map();
  for (const { definicion } of tramos) {
    for (const puesto of definicion.puestos) {
      if (puestos.has(puesto.nombre)) continue;
      const fila = await buscarOCrearPuesto(cofradia.id, puesto.nombre);
      puestos.set(puesto.nombre, fila.id);
    }
  }
  console.log(`  ${puestos.size} puestos distintos`);

  // Enlaces puesto ↔ tramo
  let enlaces = 0;
  for (const { tramo, definicion } of tramos) {
    for (const puesto of definicion.puestos) {
      const puestoId = puestos.get(puesto.nombre);
      if (!puestoId) continue;
      const yaEsta = await prisma.puestoTramo.findFirst({ where: { puestoId, tramoId: tramo.id } });
      if (!yaEsta) await prisma.puestoTramo.create({ data: { puestoId, tramoId: tramo.id } });
      enlaces++;
    }
  }
  console.log(`  ${enlaces} enlaces puesto ↔ tramo`);

  // Personas
  let indice = 0;
  let asignados = 0;
  const sinGente = [];

  for (const { tramo, definicion } of tramos) {
    for (const puesto of definicion.puestos) {
      const puestoId = puestos.get(puesto.nombre);
      if (!puestoId) continue;

      for (let n = 0; n < puesto.numero; n++) {
        const libre = siguienteLibre(indice);
        if (libre === null) {
          sinGente.push(`${puesto.nombre} (${definicion.nombre})`);
          break;
        }
        ocupados.add(libre);
        indice++;

        const hermano = await buscarOCrearHermano(hermandad.id, libre);
        const yaEsta = await prisma.puestoHermano.findFirst({
          where: { puestoId, hermanoId: hermano.id },
        });
        if (!yaEsta) {
          await prisma.puestoHermano.create({
            data: { puestoId, hermanoId: hermano.id, tramoId: tramo.id, cofradiaId: cofradia.id },
          });
        }
        asignados++;
      }
    }
  }

  console.log(`  ${asignados} personas asignadas a puestos`);
  if (sinGente.length > 0) console.log(`  Sin gente: ${sinGente.join(", ")}`);
  console.log("Listo.");
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exitCode = 1;
  });