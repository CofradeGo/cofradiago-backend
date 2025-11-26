import { prisma } from "../config/prismaClient.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/index.ts";

interface LoginPayload {
  userId: number;
  username: string;
  hermandadId: number;
  role: "DMG" | "AUXILIAR";
}

export const login = async (
  domain: string,
  username: string,
  password: string
): Promise<string> => {
  // Buscar la hermandad por domain
  const hermandad = await prisma.hermandad.findUnique({
    where: { domain },
    include: { users: true },
  });

  if (!hermandad) {
    throw new Error("HERMANDAD_NOT_FOUND");
  }

  // Buscar el usuario dentro de la hermandad
  const user = hermandad.users.find(u => u.username === username);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Validar contraseña
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Generar JWT
  const payload: LoginPayload = {
    userId: user.id,
    username: user.username,
    hermandadId: hermandad.id,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "1h" });
};
