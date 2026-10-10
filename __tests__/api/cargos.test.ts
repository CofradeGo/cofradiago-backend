import request from "supertest";
import { app } from "../../src/index.ts";

/**
 * Tests de la lógica de negocio: cargos dentro de una cofradía.
 *
 * Cubren los guards de cofradia.guards.ts (cofradía editable, nombre
 * libre, pertenencia) y los códigos de error que devuelve el
 * errorHandler central. Antes de escribirlos, los guards no estaban
 * protegidos por ningún test.
 */

const DOMINIO = "soledad-sanlucar";
const PASSWORD = "123456";

/** Devuelve token y la cofradía ABIERTA de la hermandad. */
async function contexto() {
  const login = await request(app)
    .post(`/api/v1/auth/login/${DOMINIO}`)
    .send({ username: "dmg_soledad", password: PASSWORD });

  const token = login.body.accessToken as string;
  const lista = await request(app)
    .get("/api/v1/cofradia")
    .set("Authorization", `Bearer ${token}`);

  const abierta = lista.body.find((c: { estado: string }) => c.estado === "ABIERTA");
  const cerrada = lista.body.find((c: { estado: string }) => c.estado === "CERRADA");

  return { token, abierta, cerrada };
}

let contador = 0;
/** Nombre único por test para no chocar con el seed. */
const nombreUnico = (base: string) => `${base} test ${++contador}`;

describe("Guards de cargo · flujo completo", () => {
  it("crea, lista, edita y borra un cargo", async () => {
    const { token, abierta } = await contexto();
    const nombre = nombreUnico("Cargo");

    // Crear
    const creado = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/cargos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre });

    expect(creado.status).toBe(201);
    expect(creado.body.cargo.nombre).toBe(nombre);
    const cargoId = creado.body.cargo.id as number;

    // Listar
    const listados = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cargos`)
      .set("Authorization", `Bearer ${token}`);

    expect(listados.status).toBe(200);
    expect(listados.body.map((c: { id: number }) => c.id)).toContain(cargoId);

    // Editar
    const renombrado = nombreUnico("Cargo editado");
    const editado = await request(app)
      .put(`/api/v1/cofradias/${abierta.id}/cargos/${cargoId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: renombrado });

    expect(editado.status).toBe(200);
    expect(editado.body.cargo.nombre).toBe(renombrado);

    // Borrar
    const borrado = await request(app)
      .delete(`/api/v1/cofradias/${abierta.id}/cargos/${cargoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(borrado.status).toBe(200);

    const trasBorrar = await request(app)
      .get(`/api/v1/cofradias/${abierta.id}/cargos`)
      .set("Authorization", `Bearer ${token}`);

    expect(trasBorrar.body.map((c: { id: number }) => c.id)).not.toContain(cargoId);
  });
});

describe("Guard: nombre libre", () => {
  it("rechaza crear un cargo con un nombre ya usado (409)", async () => {
    const { token, abierta } = await contexto();
    const nombre = nombreUnico("Duplicado");

    const primero = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/cargos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre });
    expect(primero.status).toBe(201);

    const segundo = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/cargos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre });

    expect(segundo.status).toBe(409);
    expect(segundo.body.error).toBe("NOMBRE_DUPLICADO");

    // Limpieza
    await request(app)
      .delete(`/api/v1/cofradias/${abierta.id}/cargos/${primero.body.cargo.id}`)
      .set("Authorization", `Bearer ${token}`);
  });

  it("permite renombrar a sí mismo sin dar conflicto", async () => {
    const { token, abierta } = await contexto();
    const nombre = nombreUnico("Editable");

    const creado = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/cargos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre });

    const mismo = await request(app)
      .put(`/api/v1/cofradias/${abierta.id}/cargos/${creado.body.cargo.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre });

    expect(mismo.status).toBe(200);

    await request(app)
      .delete(`/api/v1/cofradias/${abierta.id}/cargos/${creado.body.cargo.id}`)
      .set("Authorization", `Bearer ${token}`);
  });
});

describe("Guard: cofradía editable", () => {
  it("no permite crear en una cofradía CERRADA (409)", async () => {
    const { token, cerrada } = await contexto();

    const res = await request(app)
      .post(`/api/v1/cofradias/${cerrada.id}/cargos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: nombreUnico("No debe existir") });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("COFRADIA_CERRADA");
  });

  it("devuelve COFRADIA_NOT_FOUND con una id inexistente (404)", async () => {
    const { token } = await contexto();

    const res = await request(app)
      .post("/api/v1/cofradias/99999999/cargos")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Cargo huérfano" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("COFRADIA_NOT_FOUND");
  });
});

describe("Guard: recurso inexistente", () => {
  it("devuelve CARGO_NOT_FOUND al editar un id que no existe (404)", async () => {
    const { token, abierta } = await contexto();

    const res = await request(app)
      .put(`/api/v1/cofradias/${abierta.id}/cargos/99999999`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "No existe" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("CARGO_NOT_FOUND");
  });

  it("devuelve CARGO_NOT_FOUND al borrar un id que no existe (404)", async () => {
    const { token, abierta } = await contexto();

    const res = await request(app)
      .delete(`/api/v1/cofradias/${abierta.id}/cargos/99999999`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("CARGO_NOT_FOUND");
  });
});

describe("Autorización por rol", () => {
  it("el rol AUXILIAR no puede crear cargos (403)", async () => {
    const { abierta } = await contexto();

    const loginAux = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO}`)
      .send({ username: "aux1_soledad", password: PASSWORD });

    const res = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/cargos`)
      .set("Authorization", `Bearer ${loginAux.body.accessToken}`)
      .send({ nombre: nombreUnico("Prohibido") });

    expect(res.status).toBe(403);
  });

  it("sin token responde 401", async () => {
    const { abierta } = await contexto();

    const res = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/cargos`)
      .send({ nombre: "Sin token" });

    expect(res.status).toBe(401);
  });
});

describe("Formato de error del manejador central", () => {
  it("siempre devuelve { error, message }", async () => {
    const { token, abierta } = await contexto();

    const res = await request(app)
      .post(`/api/v1/cofradias/${abierta.id}/cargos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "" });

    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("message");
  });

  it("una ruta inexistente devuelve el 404 central", async () => {
    const res = await request(app).get("/api/v1/ruta-que-no-existe");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("ROUTE_NOT_FOUND");
  });
});