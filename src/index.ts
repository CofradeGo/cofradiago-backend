import "dotenv/config";
import cookieParser from "cookie-parser";
import express, { type Application } from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { entorno } from "./config/entorno.ts";
import { logger } from "./utils/logger.ts";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.ts";
import authRoutes from "./routes/auth.routes.ts";
import hermandadRoutes from "./routes/hermandad.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import passwordRoutes from "./routes/password.routes.ts";
import hermanoRouter from "./routes/hermano.route.ts";
import cofradiaRouter from "./routes/cofradia.route.ts";
import cortejosRouter from "./routes/cortejo.route.ts";
import puestoRouter from "./routes/puesto.route.ts";
import insigniaRouter from "./routes/insignia.route.ts";
import cargoRouter from "./routes/cargo.route.ts";
import insigniaElementoRouter from "./routes/insigniaElemento.route.ts";
import tramoRouter from "./routes/tramo.route.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// Middleware globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//CORS GLOBAL
const FRONTEND_URL = entorno.FRONTEND_URL;

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Rutas
app.use("/public", hermandadRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/hermandad", hermandadRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/password", passwordRoutes);
app.use("/api/v1/hermanos", hermanoRouter);
app.use("/api/v1/cofradia", cofradiaRouter);

app.use("/api/v1/cofradias/:cofradiaId/cortejos", cortejosRouter);
app.use("/api/v1/cofradias/:cofradiaId/cortejos", tramoRouter);

app.use("/api/v1/cofradias", puestoRouter);
app.use("/api/v1/cofradias", insigniaRouter);
app.use("/api/v1/cofradias", cargoRouter);
app.use("/api/v1/cofradias", insigniaElementoRouter);


// Archivos estáticos
app.use("/uploads/logos", express.static(path.join(__dirname, "..", "uploads/logos")));

// 404 y manejador de errores. Deben montarse los últimos: capturan todo
// lo que no haya respondido antes y evitan que cada controller repita
// el mapeo de errores a status HTTP.
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  const PORT = entorno.PORT;
  app.listen(PORT, "0.0.0.0", () => {
    logger.info("Servidor escuchando", {
      puerto: PORT,
      entorno: entorno.NODE_ENV,
    });
  });
}

export { app };
