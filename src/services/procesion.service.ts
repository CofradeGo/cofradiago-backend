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

export interface HermanoEnPuesto {
  id: number;
  numeroAntiguedad: number;
  nombre: string;
  apellidos: string;
}

export interface PuestoEnTramo {
  id: number;
  nombre: string;
  hermanos: HermanoEnPuesto[];
}

/** Insignia asignada a un tramo. Sin personas todavía: eso llega con
 *  el módulo de papeleta de sitio. */
export interface InsigniaEnTramo {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface CargoEnTramo {
  id: number;
  nombre: string;
  /** Cuántas plazas de ese cargo hay en el tramo. */
  cantidad: number;
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
            puesto: { select: { id: true, nombre: true } },
          },
        },
        insignias: {
          select: { insignia: { select: { id: true, nombre: true, descripcion: true } } },
        },
        cargos: {
          select: { cantidad: true, cargo: { select: { id: true, nombre: true } } },
        },
        hermanos: {
          select: {
            puestoId: true,
            hermano: {
              select: {
                id: true,
                numeroAntiguedad: true,
                nombre: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });

    const resultado: TramoEnProcesion[] = tramos.map((tramo) => {
      // Se parte de los puestos declarados en el tramo, para que uno
      // sin nadie asignado siga apareciendo con su hueco.
      const porPuesto = new Map<number, PuestoEnTramo>(
        tramo.puestos.map(({ puesto }) => [puesto.id, { ...puesto, hermanos: [] }]),
      );

      for (const asignacion of tramo.hermanos) {
        // Un puesto asignado sin pasar por el puente no debería
        // ocurrir, pero si pasara se enseña igualmente en vez de
        // perder al hermano sin avisar.
        const puesto =
          porPuesto.get(asignacion.puestoId) ??
          {
            id: asignacion.puestoId,
            nombre: `Puesto ${asignacion.puestoId}`,
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

      return {
        id: tramo.id,
        nombre: tramo.nombre,
        orden: tramo.orden,
        puestos: [...porPuesto.values()].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es"),
        ),
        insignias: porNombre(tramo.insignias.map((i) => i.insignia)),
        cargos: porNombre(
          tramo.cargos.map((c) => ({ ...c.cargo, cantidad: c.cantidad })),
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
        cargos: resultado.reduce(
          (n, t) => n + t.cargos.reduce((m, c) => m + c.cantidad, 0),
          0,
        ),
      },
    };
  },
};