import "dotenv/config";
import express, { type Application } from "express";
import { healthRouter } from "./routes/health.ts";
import testRoutes from "./routes/testRoutes.ts";
import cors from "cors";
import authRoutes from "./routes/auth.routes.ts";

const app: Application = express();
app.use(express.json());

//Para permitir conexión con front
app.use(cors({ origin: "http://localhost:5173" }));

// Registrar rutas
app.use("/health", healthRouter);
// Registrar rutas
app.use("/api", testRoutes);
// Montamos las rutas
app.use("/api/v1/auth", authRoutes);

// Solo levantar el servidor si no estamos en test
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app };
