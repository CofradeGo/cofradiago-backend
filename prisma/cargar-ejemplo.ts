/**
 * Carga el ejemplo de procesión sobre una cofradía.
 *
 * Se ejecuta aparte del seed habitual (`node prisma/cargar-ejemplo.ts`)
 * porque crea decenas de hermanos y es lo que sirve para revisar la
 * vista "Ver Cortejos" con datos con forma de procesión real.
 *
 * Regla que respeta, y que la base de datos también exige: un hermano
 * no puede ocupar dos puestos dentro de la misma cofradía.
 */
import { prisma } from "../src/config/prismaClient.ts";
import {
  CORTEJO_EJEMPLO,
  hermanoInventado,
  TOTAL_EJEMPLO,
} from "./ejemplo-procesion.ts";

const DOMINIO = process.env.EJEMPLO_DOMINIO ?? "soledad-sanlucar";
const ANIO = Number(process.env.EJEMPLO_ANIO ?? 2027);

const main = async () => {
  const hermandad = await prisma.herandad.findUnique({ where: { domain: DOMINIO } });
  if (!hermandad) throw new Error(`No hay hermandad con el dominio ${DOMINIO}.`);

  const cofradia = await prisma.cofradia.findFirst({
    where: { hermandadId: hermandad.id, anio: ANIO },
  });
  if (!cofradia) throw new Error(`No hay cofradía de ${ANIO} en ${hermandad.name}.`);

  console.log(`Cargando el ejemplo sobre: ${hermandad.name} ${ANIO} (id ${cofradia.id})`);

  // ── Cortejo ───────────────────────────────────────────────────
  const cortejo = await prisma.cortejo.upsert({
    where: { id: await cortejoIdDe(cofradia.id, CORTEJO_EJEMPLO.nombre) },
    update: {},
    create: { cofradiaId: cofradia.id, nombre: CORTEJO_EJEMPLO.nombre, orden: 1 },
  });

  // ── Tramos ────────────────────────────────────────────────────
  const tramos = [];
  for (const [indice, t] of CORTEJO_EJEMPLO.tramos.entries()) {
    const tramo = await prisma.tramo.upsert({
      where: { id: await tramoIdDe(cortejo.id, t.nombre) },
      update: { orden: indice + 1 },
      create: {
        cofradiaId: cofradia.id,
        cortejoId: cortejo.id,
        nombre: t.nombre,
        orden: indice + 1,
      },
    });
    tramos.push({ tramo, definicion: t });
  }
  console.log(`  ${tramos.length} tramos`);

  // ── Puestos ───────────────────────────────────────────────────
  // Un puesto es único por cofradía (nombre), aunque ocupe varios
  // tramos. Por eso "Cirios" se crea una vez y luego se enlaza a los
  // cuatro tramos donde aparece.
  const puestos = new Map<string, number>();
  for (const { definicion } of tramos) {
    for (const p of definicion.puestos) {
      if (puestos.has(p.nombre)) continue;
      const puesto = await prisma.puesto.upsert({
        where: { cofradiaId_nombre: { cofradiaId: cofradia.id, nombre: p.nombre } },
        update: {},
        create: { cofradiaId: cofradia.id, nombre: p.nombre },
      });
      puestos.set(p.nombre, puesto.id);
    }
  }
  console.log(`  ${puestos.size} puestos distintos`);

  // ── Enlaces puesto ↔ tramo ────────────────────────────────────
  let enlaces = 0;
  for (const { tramo, definicion } of tramos) {
    for (const p of definicion.puestos) {
      const puestoId = puestos.get(p.nombre);
      if (!puestoId) continue;
      await prisma.puestoTramo.upsert({
        where: { puestoId_tramoId: { puestoId, tramoId: tramo.id } },
        update: {},
        create: { puestoId, tramoId: tramo.id },
      });
      enlaces++;
    }
  }
  console.log(`  ${enlaces} enlaces puesto ↔ tramo`);

  // ── Hermanos ──────────────────────────────────────────────────
  // Se reparten entre los puestos. Cada hermano entra una sola vez:
  // la restricción la impone el índice (hermanoId, cofradiaId): cada uno
  // entra una sola vez, en un tramo y en un puesto de los de su tramo.
  let indiceHermano = 0;
  const yaOcupados = new Set<number>();
  let asignados = 0;
  const sinHermanos: string[] = [];

  for (const { tramo, definicion } of tramos) {
    for (const p of definicion.puestos) {
      const puestoId = puestos.get(p.nombre);
      if (!puestoId) continue;

      for (let n = 0; n < p.numero; n++) {
        const libre = siguienteLibre(indiceHermano, yaOcupados);
        if (libre === null) {
          sinHermanos.push(`${p.nombre} (tramo ${definicion.nombre})`);
          break;
        }
        yaOcupados.add(libre);
        indiceHermano++;

        const { nombre, apellidos } = hermanoInventado(libre);
        const hermano = await crearHermanoSiNoExiste({
          hermandadId: hermandad.id,
          indice: libre,
          nombre,
          apellidos,
        });

        await prisma.puestoHermano.upsert({
          where: { puestoId_hermanoId: { puestoId, hermanoId: hermano.id } },
          update: { tramoId: tramo.id },
          create: {
            puestoId,
            hermanoId: hermano.id,
            tramoId: tramo.id,
            cofradiaId: cofradia.id,
          },
        });
        asignados++;
      }
    }
  }

  console.log(`  ${asignados} hermanos asignados a puestos`);
  if (sinHermanos.length) {
    console.log(
      `  ${sinHermanos.length} puestos se quedaron sin gente: ${sinHermanos.join(", ")}`,
    );
    console.log(`  (el ejemplo pide ${TOTAL_EJEMPLO} en total)`);
  }

  await prisma.$disconnect();
  console.log("Listo.");
};

/** Devuelve un índice libre, porque cada hermano ocupa un solo puesto. */
const siguienteLibre = (desde: number, ocupados: Set<number>): number | null => {
  let i = desde;
  while (i < desde + TOTAL_EJEMPLO * 2) {
    if (!ocupados.has(i)) return i;
    i++;
  }
  return null;
};

const crearHermanoSiNoExiste = async ({
  hermandadId,
  indice,
  nombre,
  apellidos,
}: {
  hermandadId: number;
  indice: number;
  nombre: string;
  apellidos: string;
}) => {
  // El número de antigüedad es único por hermandad. Se reparten en
  // franjas altas para no chocar con los hermanos del seed.
  const numeroAntiguedad = 2000 + indice;

  return prisma.hermano.upsert({
    where: { hermandadId_numeroAntiguedad: { hermandadId, numeroAntiguedad } },
    update: {},
    create: {
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

/** Busca el id por nombre para poder hacer upsert sin depender del orden. */
const cortejoIdDe = async (cofradiaId: number, nombre: string): Promise<number> => {
  const encontrado = await prisma.cortejo.findFirst({ where: { cofradiaId, nombre } });
  return encontrado?.id ?? -1;
};

const tramoIdDe = async (cortejoId: number, nombre: string): Promise<number> => {
  const encontrado = await prisma.tramo.findFirst({ where: { cortejoId, nombre } });
  return encontrado?.id ?? -1;
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});