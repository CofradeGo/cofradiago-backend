import "dotenv/config";

// Base de datos
export const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL debe estar definido en .env");
}

// JWT
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET debe estar definido en .env");
}

// Otros parámetros globales (opcional)
export const PORT = process.env.PORT || 3000;
