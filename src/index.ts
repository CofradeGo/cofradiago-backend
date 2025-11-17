import "dotenv/config";
import express, { type Application } from "express";
import { healthRouter } from "./routes/health.ts";

const app: Application = express();
app.use(express.json());

// Registrar rutas
app.use("/health", healthRouter);

// Solo levantar el servidor si no estamos en test
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app };
