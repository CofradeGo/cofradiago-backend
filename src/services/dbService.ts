const dbUrl = process.env.DB_URL;

if (!dbUrl) {
  throw new Error("La variable de entorno DB_URL no está definida");
}

// Aquí podrías conectar mongoose o cualquier cliente de DB
// Ejemplo (no hace falta ejecutar ahora):
// import mongoose from 'mongoose';
// mongoose.connect(dbUrl);
