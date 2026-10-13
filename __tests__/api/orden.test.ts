import request from "supertest";
import { app } from "../../src/index.ts";

/**
 * Tests de reordenación por arrastre (cortejos y tramos).
 *
 * El cliente manda los ids ya en el orden que quiere y el servidor
 * asigna las posiciones 1..n. Estos tests comprueban que se guarda,
 * que se renumera sin huecos y que no se aceptan listas que no
 * casen con lo guardado: aplicarlas dejaría el listado descoyuntado
 * sin avisar a nadie.
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

  return { token, abierta };
}

const ordenados = (res: request.Response, campo = "cortejos") =>
  res.body[campo].map((e: { orden: number }) => e.orden);

/** Deja el listado como estaba, para que los tests no dependan del orden. */
async function restaurarOrden(
  token: string,
  cofradiaId: number,
  cortejoId: number,
  cortejoIds: number[],
  tramoIds: number[],
) {
  await request(app)
    .patch(`/api/v1/cofradias/${cofradiaId}/cortejos/orden`)
    .set("Authorization", `Bearer ${token}`)
    .send({ ids: cortejoIds });

  await request(app)
    .patch(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/orden`)
    .set("Authorization", `Bearer ${token}`)
    .send({ ids: tramoIds });
}

describe("Reordenar cortejos", () => {
  it("guarda el nuevo orden y renumera de 1 a n sin huecos", async () => {
    const { token, abierta } = await contexto();

    const antes = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cortejos`)
      .set("Authorization", `Bearer ${token}`);

    const ids = antes.body.map((c: { id: number }) => c.id);
    const invertido = [...ids].reverse();

    const res = await request(app)
      .patch(`/api/v1/cofradias/${abierta.id}/cortejos/orden`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ids: invertido });

    expect(res.status).toBe(200);
    expect(res.body.cortejos.map((c: { id: number }) => c.id)).toEqual(invertido);
    expect(ordenados(res)).toEqual([1, 2, 3, 4, 5].slice(0, ids.length));

    // El orden persiste: una recarga devuelve lo mismo.
    const despues = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cortejos`)
      .set("Authorization", `Bearer ${token}`);

    expect(despues.body.map((c: { id: number }) => c.id)).toEqual(invertido);

    await restaurarOrden(token, abierta.id, antes.body[0].id, ids, []);
  });

  it("rechaza una lista con menos elementos de los guardados", async () => {
    const { token, abierta } = await contexto();

    const res = await request(app)
      .patch(`/api/v1/cofradias/${abierta.id}/cortejos/orden`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ids: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ORDENES_INVALIDOS");
  });

  it("rechaza una lista con ids repetidos", async () => {
    const { token, abierta } = await contexto();

    const antes = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cortejos`)
      .set("Authorization", `Bearer ${token}`);
    const ids = antes.body.map((c: { id: number }) => c.id);

    const res = await request(app)
      .patch(`/api/v1/cofradias/${abierta.id}/cortejos/orden`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ids: [ids[0], ...ids] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ORDENES_INVALIDOS");
  });

  it("no deja que un AUXILIAR reordene", async () => {
    const { abierta } = await contexto();

    const loginAux = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO}`)
      .send({ username: "aux1_soledad", password: PASSWORD });

    const res = await request(app)
      .patch(`/api/v1/cofradias/${abierta.id}/cortejos/orden`)
      .set("Authorization", `Bearer ${loginAux.body.accessToken}`)
      .send({ ids: [] });

    expect(res.status).toBe(403);
  });
});

describe("Reordenar tramos", () => {
  it("guarda el nuevo orden de los tramos de un cortejo", async () => {
    const { token, abierta } = await contexto();

    const cortejos = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cortejos`)
      .set("Authorization", `Bearer ${token}`);
    const cortejoId = cortejos.body[0].id as number;

    const antes = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cortejos/${cortejoId}/tramos`)
      .set("Authorization", `Bearer ${token}`);

    const tramoIds = antes.body.map((t: { id: number }) => t.id);
    if (tramoIds.length < 2) {
      // Sin al menos dos tramos no hay nada que reordenar.
      return;
    }

    // Mover el último al principio.
    const movido = [tramoIds[tramoIds.length - 1], ...tramoIds.slice(0, -1)];

    const res = await request(app)
      .patch(`/api/v1/cofradias/${abierta.id}/cortejos/${cortejoId}/tramos/orden`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ids: movido });

    expect(res.status).toBe(200);
    expect(res.body.tramos.map((t: { id: number }) => t.id)).toEqual(movido);

    const despues = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cortejos/${cortejoId}/tramos`)
      .set("Authorization", `Bearer ${token}`);

    expect(despues.body.map((t: { id: number }) => t.id)).toEqual(movido);

    await restaurarOrden(
      token,
      abierta.id,
      cortejoId,
      cortejos.body.map((c: { id: number }) => c.id),
      tramoIds,
    );
  });

  it("rechaza ids de un cortejo distinto", async () => {
    const { token, abierta } = await contexto();

    const cortejos = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cortejos`)
      .set("Authorization", `Bearer ${token}`);

    const otroCortejoId = cortejos.body[1]?.id ?? cortejos.body[0].id;

    const tramos = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cortejos/${cortejos.body[0].id}/tramos`)
      .set("Authorization", `Bearer ${token}`);
    const tramoIds = tramos.body.map((t: { id: number }) => t.id);

    const res = await request(app)
      .patch(`/api/v1/cofradias/${abierta.id}/cortejos/${otroCortejoId}/tramos/orden`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ids: tramoIds });

    // O el cortejo no existe, o sus tramos no son los enviados.
    expect([400, 404]).toContain(res.status);
  });

  it("no deja que un AUXILIAR reordene los tramos", async () => {
    const { abierta } = await contexto();

    const loginAux = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO}`)
      .send({ username: "aux1_soledad", password: PASSWORD });

    const cortejos = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cortejos`)
      .set("Authorization", `Bearer ${loginAux.body.accessToken}`);

    const res = await request(app)
      .patch(`/api/v1/cofradias/${abierta.id}/cortejos/${cortejos.body[0].id}/tramos/orden`)
      .set("Authorization", `Bearer ${loginAux.body.accessToken}`)
      .send({ ids: [] });

    expect(res.status).toBe(403);
  });
});