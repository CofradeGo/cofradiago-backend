import request from "supertest";
import { app } from "../src/index";
import { prisma } from "../src/config/prismaClient";
import bcrypt from "bcrypt";

describe("POST /api/v1/auth/login/:domain Integration Tests", () => {
  const DOMAIN = "soledad";

  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.hermandad.deleteMany();

    const hashedPassword = await bcrypt.hash("123456", 10);

    await prisma.hermandad.create({
      data: {
        name: DOMAIN,
        domain: DOMAIN,
        users: {
          create: [
            { username: "dmg", role: "DMG", password: hashedPassword },
            { username: "aux1", role: "AUXILIAR", password: hashedPassword },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Login DMG correcto devuelve JWT", async () => {
    const res = await request(app)
      .post(`/api/v1/auth/login/${DOMAIN}`)
      .send({ username: "dmg", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("Login auxiliar correcto devuelve JWT", async () => {
    const res = await request(app)
      .post(`/api/v1/auth/login/${DOMAIN}`)
      .send({ username: "aux1", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
