import request from "supertest";
import { app } from "../../src/index.ts";

/**
 * Tests de humo del login.
 *
 * Fija el contrato público del endpoint: qué status y qué cuerpo
 * devuelve. Si un refactor cambia cualquiera de estas respuestas,
 * estos tests fallan.
 */

const DOMINIO_VALIDO = "soledad-sanlucar";
const DOMINIO_INEXISTENTE = "no-existe-esta-hermandad";
const USUARIO = "dmg_soledad";
const PASSWORD = "123456";

describe("POST /api/v1/auth/login/:domain", () => {
  it("devuelve 200 y un accessToken con credenciales válidas", async () => {
    const res = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO_VALIDO}`)
      .send({ username: USUARIO, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.body.accessToken.split(".")).toHaveLength(3);
  });

  it("establece el refreshToken en cookie httpOnly", async () => {
    const res = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO_VALIDO}`)
      .send({ username: USUARIO, password: PASSWORD });

    const cookie = res.headers["set-cookie"] as unknown as string[] | undefined;
    expect(cookie).toBeDefined();
    expect(cookie!.join(";")).toContain("refreshToken");
    expect(cookie!.join(";")).toContain("HttpOnly");
  });

  it("no devuelve el refreshToken en el cuerpo de la respuesta", async () => {
    const res = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO_VALIDO}`)
      .send({ username: USUARIO, password: PASSWORD });

    expect(res.body).not.toHaveProperty("refreshToken");
  });

  it("rechaza una contraseña incorrecta con INVALID_CREDENTIALS", async () => {
    const res = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO_VALIDO}`)
      .send({ username: USUARIO, password: "contrasena-equivocada" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_CREDENTIALS");
  });

  it("rechaza un usuario inexistente con INVALID_CREDENTIALS", async () => {
    const res = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO_VALIDO}`)
      .send({ username: "usuario-que-no-existe", password: PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_CREDENTIALS");
  });

  it("no revela si el dominio existe: responde igual que una contraseña mala", async () => {
    const res = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO_INEXISTENTE}`)
      .send({ username: USUARIO, password: PASSWORD });

    // Mismo status y mismo código que una contraseña incorrecta,
    // para no permitir enumerar hermandades existentes.
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_CREDENTIALS");
  });

  it("acepta el rol AUXILIAR igual que el DMG", async () => {
    const res = await request(app)
      .post(`/api/v1/auth/login/${DOMINIO_VALIDO}`)
      .send({ username: "aux1_soledad", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });
});

describe("POST /api/v1/auth/refresh-token", () => {
  it("responde 401 si no hay cookie de refresh", async () => {
    const res = await request(app).post("/api/v1/auth/refresh-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("REFRESH_TOKEN_REQUIRED");
  });
});