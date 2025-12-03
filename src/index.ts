import "dotenv/config";
import cookieParser from "cookie-parser";
import express, { type Application } from "express";
import testRoutes from "./routes/test.routes.ts";
import cors from "cors";
import authRoutes from "./routes/auth.routes.ts";
import hermandadRoutes from "./routes/hermandad.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import passwordRoutes from "./routes/password.routes.ts";
import path from "path";
import { fileURLToPath } from "url";

// Resolver __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();
app.use(express.json());
app.use(cookieParser()); // para cookies
//Para permitir conexión con front
app.use(cors({ origin: "http://localhost:5173" }));
//Ruta para el test de middleware
app.use("/api/test", testRoutes);

// Montamos las rutas
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/hermandad", hermandadRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/password", passwordRoutes);

// Routes public
app.use("/public", hermandadRoutes);

app.use("/uploads/logos", express.static(path.join(__dirname, "..", "uploads/logos")));

// Solo levantar el servidor si no estamos en test
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app };
