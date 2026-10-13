import { prisma } from "../config/prismaClient.ts";
import { obtenerCofradia } from "./guards/cofradia.guards.ts";
import { AppError } from "../errors/AppError.ts";

/**
 * Lectura de la procesión tal y como se entiende: un cortejo, sus
 * tramos en orden de marcha y, dentro de cada tramo, los puestos con
 * los hermanos que los ocupan.
 *
 * Va en una sola consulta a propósito. La vista tiene que mostrar las
 * tres cosas juntas, y pedirlas por separado serían tres viajes por
 * cada tramo de la procesión.
 */

/**
 * Los datos de un hermano que se enseñan en la procesión. Lo mismo en
 * puestos, insignias y cargos, para que se ordenen igual en los tres.
 */
const CAMPOS_HERMANO = {
  id: true,
  numeroAntiguedad: true,
  nombre: true,
  apellidos: true,
} as const;

export interface HermanoEnPuesto {
  id: number;
  numeroAntiguedad: number;
  nombre: string;
  apellidos: string;
}

export interface PuestoEnTramo {
  id: number;
  nombre: string;
  /** Cuántas personas hacen falta en este puesto. */
  plazas: number;
  hermanos: HermanoEnPuesto[];
}

export interface InsigniaEnTramo {
  id: number;
  nombre: string;
  descripcion?: string | null;
  /** Cuántas personas llevan esta insignia: hay una sola pieza, pero
   *  la cargan varias. */
  plazas: number;
  hermanos: HermanoEnPuesto[];
}

export interface CargoEnTramo {
  id: number;
  nombre: string;
  /** Cuántas personas hacen falta en este cargo. */
  plazas: number;
  hermanos: HermanoEnPuesto[];
}

export interface TramoEnProcesion {
  id: number;
  nombre: string;
  orden: number;
  puestos: PuestoEnTramo[];
  insignias: InsigniaEnTramo[];
  cargos: CargoEnTramo[];
}

export interface Procesion {
  cortejo: {
    id: number;
    nombre: string;
    orden: number;
  };
  tramos: TramoEnProcesion[];
  totales: {
    tramos: number;
    puestos: number;
    hermanos: number;
    insignias: number;
    /**
     * Plazas de cargo que suman todos los tramos, no número de cargos
     * distintos: un tramo con tres diputados de tramo aporta tres
     * plazas aunque sea un solo cargo.
     */
    cargos: number;
    /**
     * Personas que hacen falta en todo el cortejo, sumando las tres
     * clases. Es la cifra que sirve para saber cuánto trabajo hay: con
     * `cargos` a secas, "2 cargos" escondía que hacen falta cuatro
     * personas, y ahora que puestos e insignias también llevan plazas,
     * sumar solo una de las tres daría un número engañoso.
     */
    plazas: number;
  };
}

export const procesionService = {
  obtenerProcesion: async (
    cofradiaId: number,
    cortejoId: number,
  ): Promise<Procesion> => {
    await obtenerCofradia(cofradiaId);

    const cortejo = await prisma.cortejo.findUnique({
      where: { id: cortejoId },
      select: { id: true, cofradiaId: true, nombre: true, orden: true },
    });

    if (!cortejo) throw new AppError("CORTEJO_NOT_FOUND");
    if (cortejo.cofradiaId !== cofradiaId) {
      throw new AppError("CORTEJO_NOT_BELONG_TO_COFRADIA");
    }

    // Una consulta trae los tramos con sus puestos y con la gente
    // asignada en ese tramo. El agrupado se hace en memoria: son
    // decenas de filas y una consulta por tramo sería latoso sin
    // necesidad.
    const tramos = await prisma.tramo.findMany({
      where: { cofradiaId, cortejoId },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        orden: true,
        puestos: {
          select: {
            plazas: true,
            puesto: { select: { id: true, nombre: true } },
          },
        },
        insignias: {
          select: {
            plazas: true,
            insignia: { select: { id: true, nombre: true, descripcion: true } },
          },
        },
        cargos: {
          select: {
            plazas: true,
            cargo: { select: { id: true, nombre: true } },
          },
        },
        hermanos: {
          // Solo lo aceptado entra en la procesión. Lo pendiente está
          // pedido, no repartido: verlo aquí sería dar por hecho una
          // decisión que nadie ha tomado.
          where: { estado: "ACEPTADA" },
          select: {
            puestoId: true,
            hermano: { select: CAMPOS_HERMANO },
          },
        },
      },
    });

    // Los puestos vienen anidados en la consulta de arriba, pero las
    // insignias y los cargos no: `InsigniaHermano` cuelga de la
    // insignia y no del puente con el tramo, así que no hay forma de
    // pedirlo anidado. Van en dos consultas aparte y se agrupan aquí.
    const tramoIds = tramos.map((t) => t.id);
    const soloAceptadas = tramoIds.length
      ? await Promise.all([
          prisma.insigniaHermano.findMany({
            where: { tramoId: { in: tramoIds }, estado: "ACEPTADA" },
            select: {
              tramoId: true,
              insigniaId: true,
              hermano: { select: CAMPOS_HERMANO },
            },
          }),
          prisma.cargoHermano.findMany({
            where: { tramoId: { in: tramoIds }, estado: "ACEPTADA" },
            select: {
              tramoId: true,
              cargoId: true,
              hermano: { select: CAMPOS_HERMANO },
            },
          }),
        ])
      : [[], []];

    const deInsignia = soloAceptadas[0].map((f) => ({
      tramoId: f.tramoId,
      elementoId: f.insigniaId,
      hermano: f.hermano,
    }));
    const deCargo = soloAceptadas[1].map((f) => ({
      tramoId: f.tramoId,
      elementoId: f.cargoId,
      hermano: f.hermano,
    }));

    /** `${tramoId}:${elementoId}` → la gente que lo lleva. */
    const agrupar = (
      filas: {
        tramoId: number;
        elementoId: number;
        hermano: HermanoEnPuesto;
      }[],
    ) => {
      const mapa = new Map<string, HermanoEnPuesto[]>();
      for (const f of filas) {
        const clave = `${f.tramoId}:${f.elementoId}`;
        const lista = mapa.get(clave) ?? [];
        lista.push(f.hermano);
        mapa.set(clave, lista);
      }
      return mapa;
    };

    const porInsignia = agrupar(deInsignia);
    const porCargo = agrupar(deCargo);

    const resultado: TramoEnProcesion[] = tramos.map((tramo) => {
      // Se parte de los puestos declarados en el tramo, para que uno
      // sin nadie asignado siga apareciendo con su hueco.
      const porPuesto = new Map<number, PuestoEnTramo>(
        tramo.puestos.map(({ puesto, plazas }) => [
          puesto.id,
          { ...puesto, plazas, hermanos: [] },
        ]),
      );

      for (const asignacion of tramo.hermanos) {
        // Un puesto asignado sin pasar por el puente no debería
        // ocurrir, pero si pasara se enseña igualmente en vez de
        // perder al hermano sin avisar.
        const puesto = porPuesto.get(asignacion.puestoId) ?? {
          id: asignacion.puestoId,
          nombre: `Puesto ${asignacion.puestoId}`,
          // Sin plaza declarada: se sacaría del puente, que no la
          // trae. Es una red de seguridad, no un caso normal.
          plazas: 1,
          hermanos: [],
        };

        puesto.hermanos.push(asignacion.hermano);
        porPuesto.set(puesto.id, puesto);
      }

      // En la marcha manda la antigüedad: el hermano más antiguo va
      // delante dentro de su puesto.
      for (const puesto of porPuesto.values()) {
        puesto.hermanos.sort((a, b) => b.numeroAntiguedad - a.numeroAntiguedad);
      }

      const porNombre = <T extends { nombre: string }>(xs: T[]) =>
        [...xs].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      // En la marcha manda la antigüedad, igual que dentro de un puesto.
      const antiguosDe = (xs: HermanoEnPuesto[]) =>
        xs.sort((a, b) => b.numeroAntiguedad - a.numeroAntiguedad);

      return {
        id: tramo.id,
        nombre: tramo.nombre,
        orden: tramo.orden,
        puestos: [...porPuesto.values()].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es"),
        ),
        insignias: porNombre(
          tramo.insignias.map((i) => ({
            ...i.insignia,
            plazas: i.plazas,
            hermanos: antiguosDe(
              porInsignia.get(`${tramo.id}:${i.insignia.id}`) ?? [],
            ),
          })),
        ),
        cargos: porNombre(
          tramo.cargos.map((c) => ({
            ...c.cargo,
            plazas: c.plazas,
            hermanos: antiguosDe(
              porCargo.get(`${tramo.id}:${c.cargo.id}`) ?? [],
            ),
          })),
        ),
      };
    });

    return {
      cortejo: {
        id: cortejo.id,
        nombre: cortejo.nombre,
        orden: cortejo.orden,
      },
      tramos: resultado,
      totales: {
        tramos: resultado.length,
        puestos: resultado.reduce((n, t) => n + t.puestos.length, 0),
        hermanos: resultado.reduce(
          (n, t) => n + t.puestos.reduce((m, p) => m + p.hermanos.length, 0),
          0,
        ),
        insignias: resultado.reduce((n, t) => n + t.insignias.length, 0),
        cargos: resultado.reduce((n, t) => n + t.cargos.length, 0),
        plazas: resultado.reduce(
          (n, t) =>
            n +
            t.cargos.reduce((m, c) => m + c.plazas, 0) +
            t.insignias.reduce((m, i) => m + i.plazas, 0) +
            t.puestos.reduce((m, p) => m + p.plazas, 0),
          0,
        ),
      },
    };
  },
};
