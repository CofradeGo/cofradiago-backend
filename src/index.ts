import "dotenv/config";
import cookieParser from "cookie-parser";
import express, { type Application } from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import testRoutes from "./routes/test.routes.ts";
import authRoutes from "./routes/auth.routes.ts";
import hermandadRoutes from "./routes/hermandad.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import passwordRoutes from "./routes/password.routes.ts";
import hermanoRouter from "./routes/hermano.route.ts";
import cofradiaRouter from "./routes/cofradia.route.ts";
import cortejosRouter from "./routes/cortejo.route.ts";
import puestoRouter from "./routes/puesto.route.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// Middleware globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//CORS GLOBAL
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Rutas
app.use("/public", hermandadRoutes);
app.use("/api/test", testRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/hermandad", hermandadRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/password", passwordRoutes);
app.use("/api/v1/hermanos", hermanoRouter);
app.use("/api/v1/cofradia", cofradiaRouter);
app.use("/api/v1/cofradias/:cofradiaId/cortejos", cortejosRouter);
app.use("/api/v1/cofradias", puestoRouter);

// Archivos estáticos
app.use("/uploads/logos", express.static(path.join(__dirname, "..", "uploads/logos")));

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app };
