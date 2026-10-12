import request from "supertest";
import { app } from "../../src/index.ts";

/**
 * Tests de insignias dentro de una cofradía.
 *
 * El foco está en el campo `cortejoId`, que es opcional en el contrato
 * pero que reventaba la creación cuando el frontend enviaba `null`
 * (la insignia se creaba sin cortejo y Prisma abortaba con
 * "Argument `id` must not be null", devolviendo un 500).
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

  const cortejos = await request(app)
    .get(`/api/v1/cofradias/${abierta.id}/cortejos`)
    .set("Authorization", `Bearer ${token}`);

  return { token, abierta, cortejos: cortejos.body };
}

let contador = 0;
/**
 * Nombre único por test. Lleva un token de ejecución porque estos
 * tests crean entidades reales en la base de datos de pruebas: sin
 * él, una segunda ejecución sin volver a sembrar chocaría con los
 * nombres de la anterior.
 */
const EJECUCION = Date.now().toString(36);
const nombreUnico = (base: string) => `${base} ${EJECUCION}-${++contador}`;

describe("Insignias · asignación de cortejo", () => {
  it("crea una insignia sin cortejo cuando cortejoId es null", async () => {
    const { token, abierta } = await contexto();

    const res = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: nombreUnico("Insignia"), cortejoId: null });

    // Antes devolvía 500: connect: { id: null } no es válido en Prisma.
    expect(res.status).toBe(201);
    expect(res.body.insignia.cortejos).toEqual([]);
  });

  it("crea una insignia cuando la clave cortejoId no viene", async () => {
    const { token, abierta } = await contexto();

    const res = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: nombreUnico("Insignia") });

    expect(res.status).toBe(201);
    expect(res.body.insignia.cortejos).toEqual([]);
  });

  it("crea una insignia y la asocia al cortejo indicado", async () => {
    const { token, abierta, cortejos } = await contexto();
    const cortejo = cortejos[0];

    const res = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: nombreUnico("Insignia"), cortejoId: cortejo.id });

    expect(res.status).toBe(201);
    expect(res.body.insignia.cortejos).toHaveLength(1);
    expect(res.body.insignia.cortejos[0].id).toBe(cortejo.id);
  });

  it("rechaza un cortejo de otra cofradía", async () => {
    const { token, abierta, cortejos } = await contexto();
    const cortejo = cortejos[0];

    const res = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: nombreUnico("Insignia"), cortejoId: cortejo.id + 100000 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("CORTEJO_NOT_FOUND");
  });

  it("desasocia una insignia al editarla con cortejoId null", async () => {
    const { token, abierta, cortejos } = await contexto();
    const cortejo = cortejos[0];

    const creado = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: nombreUnico("Insignia"), cortejoId: cortejo.id });

    const insigniaId = creado.body.insignia.id as number;
    expect(creado.body.insignia.cortejos).toHaveLength(1);

    const editado = await request(app)
      .put(`/api/v1/cofradias/${abierta.id}/insignias/${insigniaId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ cortejoId: null });

    expect(editado.status).toBe(200);
    expect(editado.body.insignia.cortejos).toEqual([]);
  });
});

describe("Insignias · flujo completo", () => {
  it("crea, lista, edita y borra una insignia", async () => {
    const { token, abierta } = await contexto();
    const nombre = nombreUnico("Insignia");

    const creado = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre, descripcion: "Descripción inicial" });

    expect(creado.status).toBe(201);
    const insigniaId = creado.body.insignia.id as number;

    const listados = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`);

    expect(listados.status).toBe(200);
    expect(listados.body.map((i: { id: number }) => i.id)).toContain(insigniaId);

    const editado = await request(app)
      .put(`/api/v1/cofradias/${abierta.id}/insignias/${insigniaId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: `${nombre} editado` });

    expect(editado.status).toBe(200);
    expect(editado.body.insignia.nombre).toBe(`${nombre} editado`);

    const borrado = await request(app)
      .delete(`/api/v1/cofradias/${abierta.id}/insignias/${insigniaId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(borrado.status).toBe(200);

    const despues = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`);

    expect(despues.body.map((i: { id: number }) => i.id)).not.toContain(insigniaId);
  });

  it("rechaza dos insignias con el mismo nombre en la misma cofradía", async () => {
    const { token, abierta } = await contexto();
    const nombre = nombreUnico("Insignia");

    await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre });

    const duplicada = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre });

    expect(duplicada.status).toBe(409);
  });

  it("no permite que un AUXILIAR cree insignias", async () => {
    const { abierta } = await contexto();

    const loginAux = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO}`)
      .send({ username: "aux1_soledad", password: PASSWORD });

    const res = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/insignias`)
      .set("Authorization", `Bearer ${loginAux.body.accessToken}`)
      .send({ nombre: nombreUnico("Insignia") });

    expect(res.status).toBe(403);
  });
});