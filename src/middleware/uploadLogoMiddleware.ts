// src/middleware/uploadLogo.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Middleware Multer para subir logos de hermandad.
 * - Guarda en /uploads/logos/
 * - Nombre determinístico si se pasa domain o hermandadId (evita acumular ficheros)
 * - Validación de tipo y tamaño (2MB por defecto)
 */

// Ruta absoluta a uploads/logos en la raíz del proyecto
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "logos");

// Crear directorio si no existe (startup)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Límite  a 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req: Request & { body: unknown }, file, cb) => {
    const originalExt = path.extname(file.originalname).toLowerCase();

    // Intentamos generar un nombre determinístico si recibimos domain o hermandadId
    const domain = (req.params && req.params.domain) || req.body.domain || req.body.hermandadDomain;
    const hermandadId = req.body.hermandadId || (req.params && req.params.hermandadId);

    let filename: string;
    if (domain) {
      // limpiar domain: caracteres permitidos [a-z0-9_-]
      const safeDomain = String(domain).replace(/[^a-z0-9_-]/gi, "").toLowerCase();
      filename = `${safeDomain}_logo${originalExt}`;
    } else if (hermandadId) {
      filename = `hermandad_${String(hermandadId)}_logo${originalExt}`;
    } else {
      // fallback: uuid
      filename = `${uuidv4()}${originalExt}`;
    }

    cb(null, filename);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo imágenes (png, jpg, jpeg, webp, gif)."));
  }
};

export const uploadLogoMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
