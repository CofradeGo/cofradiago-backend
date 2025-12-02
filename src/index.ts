import "dotenv/config";
import express, { type Application } from "express";
import testRoutes from "./routes/test.routes.ts";
import cors from "cors";
import authRoutes from "./routes/auth.routes.ts";
import hermandadRoutes from "./routes/hermandad.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import passwordRoutes from "./routes/password.routes.ts";

const app: Application = express();
app.use(express.json());

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

// Solo levantar el servidor si no estamos en test
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app };
