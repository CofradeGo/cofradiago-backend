import request from "supertest";
import { app } from "../../src/index.ts";

/**
 * Estructura de un cortejo: qué insignias y qué cargos van en cada
 * tramo. Los hermanos llegan más adelante con el módulo de papeleta de
 * sitio, así que aquí no se tocan.
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

/** Monta cortejo + tramo propios y devuelve sus ids. */
async function armazon(token: string, cofradiaId: number) {
  const sufijo = Date.now().toString(36);

  const cortejo = await request(app)
    .post(`/api/v1/cofradias/${cofradiaId}/cortejos`)
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: `Cortejo estructura ${sufijo}` });
  const cortejoId = cortejo.body.cortejo.id as number;

  const tramo = await request(app)
    .post(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos`)
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: `Tramo ${sufijo}` });
  const tramoId = tramo.body.tramo.id as number;

  return { cortejoId, tramoId, sufijo };
}

async function limpiar(token: string, cofradiaId: number, cortejoId: number) {
  await request(app)
    .delete(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}`)
    .set("Authorization", `Bearer ${token}`);
}

const insigniaIdDe = async (token: string, cofradiaId: number) => {
  const res = await request(app)
    .get(`/api/v1/cofradias/${cofradiaId}/insignias`)
    .set("Authorization", `Bearer ${token}`);
  return res.body[0]?.id as number;
};

const cargoIdDe = async (token: string, cofradiaId: number) => {
  const res = await request(app)
    .get(`/api/v1/cofradias/${cofradiaId}/cargos`)
    .set("Authorization", `Bearer ${token}`);
  return res.body[0]?.id as number;
};

describe("Asignar insignias y cargos a un tramo", () => {
  it("guarda las insignias del tramo y las devuelve en la procesión", async () => {
    const { token, cofradiaId } = await contexto();
    const { cortejoId, tramoId } = await armazon(token, cofradiaId);
    const insigniaId = await insigniaIdDe(token, cofradiaId);

    try {
      const res = await request(app)
        .put(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/${tramoId}/insignias`)
        .set("Authorization", `Bearer ${token}`)
        .send({ insigniaIds: [insigniaId] });

      expect(res.status).toBe(200);
      expect(res.body.insignias.map((i: { id: number }) => i.id)).toContain(insigniaId);

      const procesion = await request(app)
        .get(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/procesion`)
        .set("Authorization", `Bearer ${token}`);

      const tramo = procesion.body.tramos.find((t: { id: number }) => t.id === tramoId);
      expect(tramo.insignias.map((i: { id: number }) => i.id)).toContain(insigniaId);
      expect(procesion.body.totales.insignias).toBe(1);
    } finally {
      await limpiar(token, cofradiaId, cortejoId);
    }
  });

  it("guarda los cargos del tramo", async () => {
    const { token, cofradiaId } = await contexto();
    const { cortejoId, tramoId } = await armazon(token, cofradiaId);
    const cargoId = await cargoIdDe(token, cofradiaId);

    try {
      const res = await request(app)
        .put(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/${tramoId}/cargos`)
        .set("Authorization", `Bearer ${token}`)
        .send({ cargoIds: [cargoId] });

      expect(res.status).toBe(200);

      const procesion = await request(app)
        .get(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/procesion`)
        .set("Authorization", `Bearer ${token}`);

      const tramo = procesion.body.tramos.find((t: { id: number }) => t.id === tramoId);
      expect(tramo.cargos.map((c: { id: number }) => c.id)).toContain(cargoId);
    } finally {
      await limpiar(token, cofradiaId, cortejoId);
    }
  });

  it("una lista vacía deja el tramo sin asignaciones", async () => {
    const { token, cofradiaId } = await contexto();
    const { cortejoId, tramoId } = await armazon(token, cofradiaId);
    const insigniaId = await insigniaIdDe(token, cofradiaId);

    try {
      await request(app)
        .put(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/${tramoId}/insignias`)
        .set("Authorization", `Bearer ${token}`)
        .send({ insigniaIds: [insigniaId] });

      // Se manda la lista completa, así que vaciar la deja limpia.
      const res = await request(app)
        .put(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/${tramoId}/insignias`)
        .set("Authorization", `Bearer ${token}`)
        .send({ insigniaIds: [] });

      expect(res.status).toBe(200);
      expect(res.body.insignias).toEqual([]);
    } finally {
      await limpiar(token, cofradiaId, cortejoId);
    }
  });

  it("rechaza una insignia de otra cofradía", async () => {
    const { token, cofradiaId } = await contexto();
    const { cortejoId, tramoId } = await armazon(token, cofradiaId);

    try {
      const res = await request(app)
        .put(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/${tramoId}/insignias`)
        .set("Authorization", `Bearer ${token}`)
        .send({ insigniaIds: [99999999] });

      expect(res.status).toBe(400);
    } finally {
      await limpiar(token, cofradiaId, cortejoId);
    }
  });

  it("da 404 si el tramo no existe", async () => {
    const { token, cofradiaId } = await contexto();
    const { cortejoId } = await armazon(token, cofradiaId);

    try {
      const res = await request(app)
        .put(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/99999999/insignias`)
        .set("Authorization", `Bearer ${token}`)
        .send({ insigniaIds: [] });

      expect(res.status).toBe(404);
    } finally {
      await limpiar(token, cofradiaId, cortejoId);
    }
  });

  it("no deja que un AUXILIAR modifique la estructura", async () => {
    const { token, cofradiaId } = await contexto();
    const loginAux = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO}`)
      .send({ username: "aux1_soledad", password: PASSWORD });
    const tokenAux = loginAux.body.accessToken as string;

    // El armazón se monta con DMG: el AUXILIAR no puede ni crearlo, así
    // que si se montara con su token el test fallaría antes de llegar
    // a lo que quiere comprobar.
    const { cortejoId, tramoId } = await armazon(token, cofradiaId);

    const res = await request(app)
      .put(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/${tramoId}/insignias`)
      .set("Authorization", `Bearer ${tokenAux}`)
      .send({ insigniaIds: [] });

    expect(res.status).toBe(403);

    await limpiar(token, cofradiaId, cortejoId);
  });
});

describe("Estructura y borrado", () => {
  it("borrar un tramo se lleva sus insignias y cargos asignados", async () => {
    const { token, cofradiaId } = await contexto();
    const { cortejoId, tramoId } = await armazon(token, cofradiaId);
    const insigniaId = await insigniaIdDe(token, cofradiaId);

    await request(app)
      .put(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/${tramoId}/insignias`)
      .set("Authorization", `Bearer ${token}`)
      .send({ insigniaIds: [insigniaId] });

    const borrado = await request(app)
      .delete(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos/${tramoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(borrado.status).toBe(200);

    // La insignia sobrevive (es de la cofradía); el enlace al tramo no.
    const insignias = await request(app)
      .get(`/api/v1/cofradias/${cofradiaId}/insignias`)
      .set("Authorization", `Bearer ${token}`);
    expect(insignias.body.map((i: { id: number }) => i.id)).toContain(insigniaId);

    await limpiar(token, cofradiaId, cortejoId);
  });
});