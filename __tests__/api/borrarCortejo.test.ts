import request from "supertest";
import { app } from "../../src/index.ts";
import { prisma } from "../../src/config/prismaClient.ts";

/**
 * Borrar un cortejo con tramos dentro.
 *
 * Regresión: la relación Tramo → Cortejo era restrictiva, así que
 * borrar un cortejo que tenía tramos fallaba con "Foreign key
 * constraint violated on Tramo_cortejoId_fkey". Ahora va en cascada.
 *
 * La asignación de una persona a un puesto se inserta por Prisma y no
 * por la API porque todavía no hay endpoint para hacerla. Aquí se
 * comprueba la cascada en la base de datos, que es donde vive.
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

const E = Date.now().toString(36);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Borrar cortejo · con y sin tramos", () => {
  it("borra el cortejo, sus tramos y las asignaciones, y deja el puesto", async () => {
    const { token, cofradiaId } = await contexto();

    const cortejo = await request(app)
      .post(`/api/v1/cofradias/${cofradiaId}/cortejos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: `Cortejo con tramos ${E}` });
    expect(cortejo.status).toBe(201);
    const cortejoId = cortejo.body.cortejo.id as number;

    const tramo = await request(app)
      .post(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}/tramos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: `Tramo ${E}` });
    expect(tramo.status).toBe(201);
    const tramoId = tramo.body.tramo.id as number;

    const puesto = await request(app)
      .post(`/api/v1/cofradias/${cofradiaId}/puestos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: `Puesto ${E}` });
    expect(puesto.status).toBe(201);
    const puestoId = puesto.body.puesto.id as number;

    // Enlace puesto ↔ tramo y una persona occupying ese puesto.
    await prisma.puestoTramo.create({ data: { puestoId, tramoId } });

    // Un hermano sin asignación en esta cofradía: la regla de la base de
    // datos es una sola plaza por persona y cofradía, y si se escoge uno
    // que ya esté colocado la inserción falla por la razón equivocada.
    const hermano = await prisma.hermano.findFirstOrThrow({
      where: { puestos: { none: { cofradiaId } } },
    });
    await prisma.puestoHermano.create({
      data: { puestoId, tramoId, hermanoId: hermano.id, cofradiaId },
    });

    // El borrado que fallaba.
    const borrado = await request(app)
      .delete(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(borrado.status).toBe(200);

    // El tramo se fue con él, no quedó huérfano.
    expect(await prisma.tramo.count({ where: { id: tramoId } })).toBe(0);

    // Y con él las asignaciones: quién ocupa un puesto en un tramo que
    // ya no existe no significa nada.
    expect(await prisma.puestoHermano.count({ where: { tramoId } })).toBe(0);
    expect(await prisma.puestoTramo.count({ where: { tramoId } })).toBe(0);

    // El puesto sobrevive: pertenece a la cofradía, no al cortejo.
    expect(await prisma.puesto.count({ where: { id: puestoId } })).toBe(1);

    await request(app)
      .delete(`/api/v1/cofradias/${cofradiaId}/puestos/${puestoId}`)
      .set("Authorization", `Bearer ${token}`);
  });

  it("sigue borrando un cortejo sin tramos", async () => {
    const { token, cofradiaId } = await contexto();

    const cortejo = await request(app)
      .post(`/api/v1/cofradias/${cofradiaId}/cortejos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: `Cortejo vacío ${E}` });
    const cortejoId = cortejo.body.cortejo.id as number;

    const borrado = await request(app)
      .delete(`/api/v1/cofradias/${cofradiaId}/cortejos/${cortejoId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(borrado.status).toBe(200);
    expect(await prisma.cortejo.count({ where: { id: cortejoId } })).toBe(0);
  });

  it("da 404 si el cortejo no existe", async () => {
    const { token, cofradiaId } = await contexto();

    const res = await request(app)
      .delete(`/api/v1/cofradias/${cofradiaId}/cortejos/99999999`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});