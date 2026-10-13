import request from "supertest";
import { app } from "../../src/index.ts";
import { prisma } from "../../src/config/prismaClient.ts";

/**
 * Peticiones de sitio: lo que un hermano pide y en qué estado queda.
 *
 * Lo que se comprueba aquí son las tres reglas que hacen que el modelo
 * aguante: solo se pide lo que sale en el tramo, solo se acepta si hay
 * sitio, y nadie pide dos veces lo mismo en la misma cofradía.
 */

const DOMINIO = "soledad-sanlucar";
const PASSWORD = "123456";

async function contexto() {
  const login = await request(app)
    .post(`/api/v1/auth/login/${DOMINIO}`)
    .send({ username: "dmg_soledad", password: PASSWORD });

  const token = login.body.accessToken as string;
  const lista = await request(app)
    .get("/api/v1/cofradia")
    .set("Authorization", `Bearer ${token}`);

  // Sin esto el fallo dice "find is not a function" y no se sabe si fue
  // el login o el listado; aquí se ve qué devolvió cada uno.
  if (!token) {
    throw new Error(`El login falló: ${JSON.stringify(login.body).slice(0, 200)}`);
  }
  if (!Array.isArray(lista.body)) {
    throw new Error(`El listado de cofradías devolvió: ${JSON.stringify(lista.body).slice(0, 200)}`);
  }

  const abierta = lista.body.find((c: { estado: string }) => c.estado === "ABIERTA");
  return { token, cofradiaId: abierta.id as number };
}

type Armazon = {
  cortejoId: number;
  tramoId: number;
  cargoId: number;
  insigniaId: number;
  puestoId: number;
  hermanoId: number;
  /** Un segundo hermano, para las pruebas que compiten por una plaza. */
  rivalId: number;
  /** Cuántas personas caben de cada cosa en el tramo. */
  plazas: Record<"cargo" | "insignia" | "puesto", number>;
};

/**
 * Hermanos de la hermandad de la cofradía, para que tengan a quién
 * repartir las plazas.
 *
 * Se buscan con Prisma y no por la API porque el listado de hermanos
 * está paginado y devuelve un envoltorio; aquí solo hace falta saber
 * quién es quién, y meterlos por la API para luego leerlos por la API
 * sería un rodeo.
 */
async function hermanosDe(cofradiaId: number, cuantos: number) {
  const cofradia = await prisma.cofradia.findUnique({
    where: { id: cofradiaId },
    select: { hermandadId: true },
  });
  if (!cofradia) throw new Error(`La cofradía ${cofradiaId} no existe.`);

  const hermanos = await prisma.hermano.findMany({
    where: {
      hermandadId: cofradia.hermandadId,
      activo: true,
      // La base de pruebas lleva los datos de ejemplo, con hermanos ya
      // colocados. Un hermano que ya pidió sitio en esta cofradía daría
      // un 409 al montar la prueba, así que se descartan.
      puestos: { none: { cofradiaId } },
      insignias: { none: { cofradiaId } },
      cargos: { none: { cofradiaId } },
    },
    orderBy: { id: "asc" },
    take: cuantos,
    select: { id: true },
  });

  return hermanos.map((h) => h.id);
}

/** Monta cortejo, tramo, un hermano y las tres clases asignadas. */
async function armazon(token: string, cofradiaId: number): Promise<Armazon> {
  const sufijo = Date.now().toString(36);
  const plazas = { cargo: 2, insignia: 1, puesto: 3 };

  const cortejo = await request(app)
    .post(`/api/v1/cofradias/${cofradiaId}/cortejos`)
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: `Cortejo solicitudes ${sufijo}` });
  const cortejoId = cortejo.body.cortejo.id as number;

  const tramo = await request(app)
    .post(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos`)
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: `Tramo ${sufijo}` });
  const tramoId = tramo.body.tramo.id as number;

  const idDe = async (ruta: string) => {
    const res = await request(app)
      .get(`/api/v1/cofradias/${cofradiaId}/${ruta}`)
      .set("Authorization", `Bearer ${token}`);
    return res.body[0]?.id as number;
  };

  const cargoId = await idDe("cargos");
  const insigniaId = await idDe("insignias");
  const puestoId = await idDe("puestos");

  await asignar(token, cofradiaId, cortejoId, tramoId, "cargos", cargoId, plazas.cargo);
  await asignar(token, cofradiaId, cortejoId, tramoId, "insignias", insigniaId, plazas.insignia);
  await asignar(token, cofradiaId, cortejoId, tramoId, "puestos", puestoId, plazas.puesto);

  const [hermanoId, rivalId] = await hermanosDe(cofradiaId, 2);
  if (hermanoId === undefined || rivalId === undefined) {
    throw new Error("La hermandad necesita al menos dos hermanos activos para la prueba.");
  }

  return { cortejoId, tramoId, cargoId, insigniaId, puestoId, hermanoId, rivalId, plazas };
}

async function asignar(
  token: string,
  cofradiaId: number,
  cortejoId: number,
  tramoId: number,
  clase: "cargos" | "insignias" | "puestos",
  elementoId: number,
  plazas: number,
) {
  await request(app)
    .put(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/${tramoId}/${clase}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ [clase]: [{ id: elementoId, plazas }] });
}

const pedir = (
  token: string,
  cofradiaId: number,
  cortejoId: number,
  clase: string,
  cuerpo: Record<string, unknown>,
) =>
  request(app)
    .post(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/solicitudes/${clase}`)
    .set("Authorization", `Bearer ${token}`)
    .send(cuerpo);

async function limpiar(token: string, cofradiaId: number, cortejoId: number) {
  await request(app)
    .delete(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}`)
    .set("Authorization", `Bearer ${token}`);
}

describe("Peticiones de sitio", () => {
  it("registra una petición de puesto y la deja pendiente", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);

    try {
      const res = await pedir(token, cofradiaId, a.cortejoId, "puestos", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.puestoId,
      });

      expect(res.status).toBe(201);
      expect(res.body.solicitud).toMatchObject({
        clase: "puesto",
        elementoId: a.puestoId,
        estado: "PENDIENTE",
      });
      expect(res.body.solicitud.hermano).toContain(" ");
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });

  it("no acepta lo que no sale en ese tramo", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);

    // Otro tramo del mismo cortejo, sin nada asignado.
    const otro = await request(app)
      .post(`/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/tramos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Tramo vacío" });

    try {
      const res = await pedir(token, cofradiaId, a.cortejoId, "puestos", {
        tramoId: otro.body.tramo.id,
        hermanoId: a.hermanoId,
        elementoId: a.puestoId,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("TRAMO_SIN_ESE_ELEMENTO");
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });

  it("deja pedir las tres clases a la vez, pero una de cada", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);

    try {
      const dePuesto = await pedir(token, cofradiaId, a.cortejoId, "puestos", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.puestoId,
      });
      const deInsignia = await pedir(token, cofradiaId, a.cortejoId, "insignias", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.insigniaId,
      });
      const deCargo = await pedir(token, cofradiaId, a.cortejoId, "cargos", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.cargoId,
      });

      expect(dePuesto.status).toBe(201);
      expect(deInsignia.status).toBe(201);
      expect(deCargo.status).toBe(201);

      // Y una segunda del mismo tipo ya choca.
      const repetida = await pedir(token, cofradiaId, a.cortejoId, "puestos", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.puestoId,
      });

      expect(repetida.status).toBe(409);
      expect(repetida.body.error).toBe("YA_SOLO_HAY_UNO");
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });

  it("permite competir por una plaza y soloThen corta al aceptar", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);
    // La insignia del tramo solo tiene una plaza: dos hermanos la piden.
    const rival = a.rivalId;

    try {
      const uno = await pedir(token, cofradiaId, a.cortejoId, "insignias", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.insigniaId,
      });
      const dos = await pedir(token, cofradiaId, a.cortejoId, "insignias", {
        tramoId: a.tramoId,
        hermanoId: rival,
        elementoId: a.insigniaId,
      });

      // Pedir no comprueba el aforo: es lo normal que dos pidan lo mismo.
      expect(uno.status).toBe(201);
      expect(dos.status).toBe(201);

      const aceptar = (id: number) =>
        request(app)
          .patch(
            `/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes/insignias/${id}`,
          )
          .set("Authorization", `Bearer ${token}`)
          .send({ estado: "ACEPTADA" });

      const primero = await aceptar(uno.body.solicitud.id);
      expect(primero.status).toBe(200);
      expect(primero.body.solicitud.estado).toBe("ACEPTADA");

      const segundo = await aceptar(dos.body.solicitud.id);
      expect(segundo.status).toBe(409);
      expect(segundo.body.error).toBe("SIN_PLAZAS_LIBRES");

      // Rechazar sí se puede siempre, tenga sitio o no.
      const rechazar = await request(app)
        .patch(
          `/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes/insignias/${dos.body.solicitud.id}`,
        )
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "RECHAZADA", notas: "Ya lo lleva otro" });

      expect(rechazar.status).toBe(200);
      expect(rechazar.body.solicitud).toMatchObject({
        estado: "RECHAZADA",
        notas: "Ya lo lleva otro",
      });
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });

  it("el aceptada sale en la procesión y el pendiente no", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);
    const rival = a.rivalId;

    try {
      const pendiente = await pedir(token, cofradiaId, a.cortejoId, "puestos", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.puestoId,
      });
      const revision = await pedir(token, cofradiaId, a.cortejoId, "cargos", {
        tramoId: a.tramoId,
        hermanoId: rival,
        elementoId: a.cargoId,
      });

      await request(app)
        .patch(
          `/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes/cargos/${revision.body.solicitud.id}`,
        )
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "ACEPTADA" });

      const procesion = await request(app)
        .get(`/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/procesion`)
        .set("Authorization", `Bearer ${token}`);

      const tramo = procesion.body.tramos.find((t: { id: number }) => t.id === a.tramoId);

      // El hermano del cargo aceptado sale con ese cargo.
      expect(tramo.cargos[0].hermanos.map((h: { id: number }) => h.id)).toEqual([rival]);
      // Y el del puesto pendiente, no: pedir no es ocupar.
      expect(
        tramo.puestos.flatMap((p: { hermanos: { id: number }[] }) => p.hermanos),
      ).toHaveLength(0);
      expect(tramo.insignias[0].hermanos).toHaveLength(0);
      expect(pendiente.body.solicitud.estado).toBe("PENDIENTE");
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });

  it("la procesión enseña quién lleva cada insignia y quién tiene cada cargo", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);

    try {
      const cargo = await pedir(token, cofradiaId, a.cortejoId, "cargos", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.cargoId,
      });
      await request(app)
        .patch(
          `/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes/cargos/${cargo.body.solicitud.id}`,
        )
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "ACEPTADA" });

      const procesion = await request(app)
        .get(`/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/procesion`)
        .set("Authorization", `Bearer ${token}`);

      const tramo = procesion.body.tramos.find((t: { id: number }) => t.id === a.tramoId);
      const hermano = tramo.cargos[0].hermanos[0];

      expect(hermano.id).toBe(a.hermanoId);
      expect(hermano.nombre).toBeTruthy();
      // Sin PLAZAS_RELLENAS, el hermano sale igual que en los puestos.
      expect(hermano.numeroAntiguedad).toEqual(expect.any(Number));
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });

  it("retirar una petición aceptada deja la plaza libre otra vez", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);
    const rival = a.rivalId;

    try {
      const creada = await pedir(token, cofradiaId, a.cortejoId, "insignias", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.insigniaId,
      });
      const id = creada.body.solicitud.id;

      await request(app)
        .patch(
          `/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes/insignias/${id}`,
        )
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "ACEPTADA" });

      const delRival = await pedir(token, cofradiaId, a.cortejoId, "insignias", {
        tramoId: a.tramoId,
        hermanoId: rival,
        elementoId: a.insigniaId,
      });

      const sinSitio = await request(app)
        .patch(
          `/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes/insignias/${delRival.body.solicitud.id}`,
        )
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "ACEPTADA" });
      expect(sinSitio.status).toBe(409);

      const borrar = await request(app)
        .delete(
          `/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes/insignias/${id}`,
        )
        .set("Authorization", `Bearer ${token}`);
      expect(borrar.status).toBe(200);

      // Con la plaza liberada, el rival ya sí cabe.
      const caben = await request(app)
        .patch(
          `/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes/insignias/${delRival.body.solicitud.id}`,
        )
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "ACEPTADA" });
      expect(caben.status).toBe(200);
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });

  it("AUXILIAR consulta pero no decide", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);

    const loginAux = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO}`)
      .send({ username: "aux1_soledad", password: PASSWORD });
    const aux = loginAux.body.accessToken as string;

    try {
      const lectura = await request(app)
        .get(`/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes`)
        .set("Authorization", `Bearer ${aux}`);
      expect(lectura.status).toBe(200);

      const creada = await pedir(aux, cofradiaId, a.cortejoId, "puestos", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.puestoId,
      });
      expect(creada.status).toBe(403);
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });

  it("no deja pedir sitio a un hermano de otra hermandad", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);

    try {
      const res = await pedir(token, cofradiaId, a.cortejoId, "puestos", {
        tramoId: a.tramoId,
        hermanoId: 99999999,
        elementoId: a.puestoId,
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("HERMANDAD_NOT_FOUND");
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });

  it("rechaza un estado que no existe", async () => {
    const { token, cofradiaId } = await contexto();
    const a = await armazon(token, cofradiaId);

    try {
      const creada = await pedir(token, cofradiaId, a.cortejoId, "puestos", {
        tramoId: a.tramoId,
        hermanoId: a.hermanoId,
        elementoId: a.puestoId,
      });

      const res = await request(app)
        .patch(
          `/api/v1/cofradias/${cofradiaId}/cortejos/${a.cortejoId}/solicitudes/puestos/${creada.body.solicitud.id}`,
        )
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "QUIZAS" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("ESTADO_INVALIDO");
    } finally {
      await limpiar(token, cofradiaId, a.cortejoId);
    }
  });
});