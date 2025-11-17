import request from "supertest";
import { app } from "../src/index";

describe("GET /health", () => {
  it("should return ok and timestamp", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
    expect(typeof res.body.timestamp).toBe("string");
  });
});

describe("Variables de entorno", () => {
  it("deberían estar definidas", () => {
    expect(process.env.PORT).toBeDefined();
    expect(process.env.DB_URL).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});
