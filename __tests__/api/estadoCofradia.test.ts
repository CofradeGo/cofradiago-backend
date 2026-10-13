import request from "supertest";
import { app } from "../../src/index.ts";

/**
 * Abrir y cerrar una cofradía.
 *
 * Regresión: la tarjeta de la vista /cofradia pedía el cierre por el
 * PUT general, que filtra los campos a nombre, año y tipo. "estado" se
 * descartaba en silencio y la API respondía "No hay cambios que
 * guardar". No había ninguna otra vía para cerrar una cofradía.
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

  const abierta = lista.body.find((c: { estado: string }) => c.estado === "ABIERTA");
  return { token, cofradiaId: abierta.id as number };
}

/** Devuelve la cofradía ABIERTA al estado inicial, pase lo que pase. */
async function devolverAbierta(token: string, cofradiaId: number) {
  await request(app)
    .patch(`/api/v1/cofradia/${cofradiaId}/estado`)
    .set("Authorization", `Bearer ${token}`)
    .send({ estado: "ABIERTA" });
}

const estadoDe = async (token: string, cofradiaId: number) => {
  const res = await request(app)
    .get("/api/v1/cofradia")
    .set("Authorization", `Bearer ${token}`);
  return res.body.find((c: { id: number }) => c.id === cofradiaId).estado as string;
};

describe("Estado de la cofradía", () => {
  it("cierra una cofradía y la deja sin admitir cambios", async () => {
    const { token, cofradiaId } = await contexto();

    try {
      const cerrar = await request(app)
        .patch(`/api/v1/cofradia/${cofradiaId}/estado`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "CERRADA" });

      expect(cerrar.status).toBe(200);
      expect(cerrar.body.cofradia.estado).toBe("CERRADA");
      expect(await estadoDe(token, cofradiaId)).toBe("CERRADA");

      // Cerrada significa de verdad: los guards lo bloquean.
      const cortejo = await request(app)
        .post(`/api/v1/cofradias/${cofradiaId}/cortejos`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: `No debería existir ${Date.now()}` });

      expect(cortejo.status).toBe(409);
      expect(cortejo.body.error).toBe("COFRADIA_CERRADA");
    } finally {
      await devolverAbierta(token, cofradiaId);
    }
  });

  it("reabre una cofradía cerrada", async () => {
    const { token, cofradiaId } = await contexto();

    await request(app)
      .patch(`/api/v1/cofradia/${cofradiaId}/estado`)
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "CERRADA" });

    try {
      const abrir = await request(app)
        .patch(`/api/v1/cofradia/${cofradiaId}/estado`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "ABIERTA" });

      // `actualizarCofradia` se niega a tocar una cofradía cerrada, así
      // que reabrir no podía pasar por el PUT: hace falta este camino.
      expect(abrir.status).toBe(200);
      expect(await estadoDe(token, cofradiaId)).toBe("ABIERTA");
    } finally {
      await devolverAbierta(token, cofradiaId);
    }
  });

  it("no cambia nada si ya está en ese estado", async () => {
    const { token, cofradiaId } = await contexto();

    const res = await request(app)
      .patch(`/api/v1/cofradia/${cofradiaId}/estado`)
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "ABIERTA" });

    expect(res.status).toBe(200);
    expect(res.body.cofradia.anio).toBeDefined();
  });

  it("rechaza un estado que no existe", async () => {
    const { token, cofradiaId } = await contexto();

    const res = await request(app)
      .patch(`/api/v1/cofradia/${cofradiaId}/estado`)
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "PEPE" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ESTADO_INVALIDO");
  });

  it("da 404 si la cofradía no existe", async () => {
    const { token } = await contexto();

    const res = await request(app)
      .patch("/api/v1/cofradia/99999999/estado")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "CERRADA" });

    expect(res.status).toBe(404);
  });

  it("no deja que un AUXILIAR cierre la cofradía", async () => {
    const { cofradiaId } = await contexto();

    const loginAux = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO}`)
      .send({ username: "aux1_soledad", password: PASSWORD });

    const res = await request(app)
      .patch(`/api/v1/cofradia/${cofradiaId}/estado`)
      .set("Authorization", `Bearer ${loginAux.body.accessToken}`)
      .send({ estado: "CERRADA" });

    expect(res.status).toBe(403);
    expect(await estadoDe(loginAux.body.accessToken, cofradiaId)).toBe("ABIERTA");
  });
});

describe("Editar cofradía · nombre duplicado", () => {
  it("devuelve 409 y no 500 si el nombre y año ya existen", async () => {
    const { token } = await contexto();

    const lista = await request(app)
      .get("/api/v1/cofradia")
      .set("Authorization", `Bearer ${token}`);

    const otras = lista.body.filter((c: { estado: string }) => c.estado === "CERRADA");
    if (otras.length === 0) return;

    const destino = lista.body.find((c: { estado: string }) => c.estado === "ABIERTA");
    const original = { nombre: destino.nombre, anio: destino.anio };

    try {
      const res = await request(app)
        .put(`/api/v1/cofradia/${destino.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: otras[0].nombre, anio: otras[0].anio });

      // Antes lanzaba un Error crudo y el manejador lo traducía a 500.
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("NOMBRE_DUPLICADO");
    } finally {
      await request(app)
        .put(`/api/v1/cofradia/${destino.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(original);
    }
  });
});