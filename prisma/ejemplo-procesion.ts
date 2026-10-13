/**
 * Ejemplo de una cofradía organizada como una procesión real.
 *
 * La estructura está sacada de la lista de una hermandad de Sanlúcar
 * (un solo cortejo dividido en tramos, cada uno con sus puestos y sus
 * hermanos), pero los nombres y los números de antigüedad son
 * inventados. Sirve para poder juzgar la vista "Ver Cortejos" con
 * datos que se parezcan a los reales.
 *
 * Lo que reproduce:
 *  - Un cortejo con varios tramos ordenados.
 *  - Puestos que se repiten en varios tramos (los Cirios aparecen en
 *    cuatro) con personas distintas en cada uno.
 *  - Tramos sin numerar al final (Monaguillos, Presencia, Acólitos).
 *  - Un hermano no puede ocupar dos puestos en la misma cofradía.
 */

/** Cada bloque es un tramo, con los puestos que lo componen. */
export interface TramoEjemplo {
  nombre: string;
  /** Criterio de pertenencia, tal y como lo escribe la hermandad. */
  criterio?: string;
  puestos: PuestoEjemplo[];
}

export interface PuestoEjemplo {
  nombre: string;
  /** Cuántas personas lo ocupan. */
  numero: number;
}

/**
 * Los tramos, en orden de marcha. Los tres últimos no llevan numeración
 * porque en la lista no son tramos strictos: son los bloques que
 * cierran la procesión.
 */
export const CORTEJO_EJEMPLO: { nombre: string; tramos: TramoEjemplo[] } = {
  nombre: "Cortejo Principal",
  tramos: [
    {
      nombre: "Primer Tramo",
      puestos: [
        { nombre: "Diputado de Cruz", numero: 1 },
        { nombre: "Cruz de Guía", numero: 5 },
        { nombre: "Cirios", numero: 10 },
        { nombre: "Diputada de Tramo", numero: 1 },
      ],
    },
    {
      nombre: "Segundo Tramo",
      criterio: "Nacidos después del 31/12/2022",
      puestos: [
        { nombre: "Bandera del Dulce Nombre", numero: 5 },
        { nombre: "Cirios", numero: 17 },
      ],
    },
    {
      nombre: "Tercer Tramo",
      criterio: "Nacidos entre el 01/01/2009 y el 31/12/2013",
      puestos: [
        { nombre: "Guión de la Juventud", numero: 5 },
        { nombre: "Cirios", numero: 26 },
        { nombre: "Diputados de Tramo", numero: 2 },
        { nombre: "Diputadas de Tramo", numero: 2 },
      ],
    },
    {
      nombre: "Cuarto Tramo",
      puestos: [
        { nombre: "Bandera Cruzada", numero: 6 },
        { nombre: "Cirios", numero: 5 },
        { nombre: "Diputada de Tramo", numero: 1 },
      ],
    },
    {
      nombre: "Quinto Tramo",
      puestos: [
        { nombre: "Simpecado", numero: 5 },
        { nombre: "Penitentes", numero: 7 },
      ],
    },
    {
      nombre: "Sexto Tramo",
      puestos: [
        { nombre: "Libro de Reglas", numero: 5 },
        { nombre: "Cirios", numero: 9 },
        { nombre: "Diputado de Tramo", numero: 1 },
        { nombre: "Estandarte", numero: 4 },
      ],
    },
    {
      // Sin numeración: no es un tramo, es el bloque de los monaguillos.
      nombre: "Monaguillos",
      puestos: [{ nombre: "Monaguillos", numero: 34 }],
    },
    {
      nombre: "Presencia",
      puestos: [
        { nombre: "Paveras", numero: 4 },
        { nombre: "Bocinas", numero: 5 },
        { nombre: "Presidencia", numero: 5 },
        { nombre: "Grupo de Acólitos", numero: 15 },
      ],
    },
    {
      nombre: "Junta Directiva",
      puestos: [
        { nombre: "Maniguetas", numero: 4 },
        { nombre: "Guardamantos", numero: 4 },
        { nombre: "Auxiliar Diputado Mayor de Gobierno", numero: 1 },
        { nombre: "Diputado Mayor de Gobierno", numero: 1 },
      ],
    },
  ],
};

/** Total de hermanos que ocupa el ejemplo, por si hace falta dimensionarlo. */
export const TOTAL_EJEMPLO = CORTEJO_EJEMPLO.tramos.reduce(
  (total, tramo) => total + tramo.puestos.reduce((t, p) => t + p.numero, 0),
  0,
);

/**
 * Nombres y apellidos de relleno, para los hermanos del ejemplo.
 * No son datos reales de nadie.
 */
export const NOMBRES_EJEMPLO = [
  "Álvaro", "Jesús", "Manuel", "Francisco", "José", "Antonio", "Daniel",
  "Carlos", "Miguel", "Rafael", "Luis", "Pablo", "Sergio", "David",
  "Ignacio", "Rubén", "Adrián", "Gonzalo", "Iván", "Curro", "Victor",
] as const;

export const APELLIDOS_EJEMPLO = [
  "Morales", "Álvarez", "Rodríguez", "Gómez", "García", "Fernández",
  "López", "Martínez", "Sánchez", "Pérez", "Guzmán", "Ortiz", "Romero",
  "Navarro", "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Serrano",
  "Blanco", "Molina", "Castro", "Ortega", "Ruiz", "Marín", "Ibáñez",
] as const;

/** Nombre completo inventado a partir del índice. */
export const hermanoInventado = (indice: number): { nombre: string; apellidos: string } => {
  const nombre = NOMBRES_EJEMPLO[indice % NOMBRES_EJEMPLO.length];
  const primero = APELLIDOS_EJEMPLO[indice % APELLIDOS_EJEMPLO.length];
  const segundo = APELLIDOS_EJEMPLO[(indice * 7 + 3) % APELLIDOS_EJEMPLO.length];
  return { nombre, apellidos: `${primero} ${segundo}` };
};