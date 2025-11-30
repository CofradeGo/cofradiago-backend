import { prisma } from "../config/prismaClient.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/index.ts";
import type { User, UserRole } from "../models/user.model.ts";

interface TokenPayload {
  id: number;
  role: UserRole;
  email?: string | null | undefined;
  hermandadId: number;
  username: string;
}

export const login = async (
  domain: string,
  username: string,
  password: string
): Promise<string> => {
  const hermandad = await prisma.hermandad.findUnique({
    where: { domain },
    include: { users: true },
  });

  if (!hermandad) throw new Error("HERMANDAD_NOT_FOUND");

  const user: User | undefined = hermandad.users.find(
    (u) => u.username === username
  );

  if (!user) throw new Error("INVALID_CREDENTIALS");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("INVALID_CREDENTIALS");

  // 👇 NUEVA VALIDACIÓN
  if (!user.isActive) throw new Error("USER_INACTIVE");

  if (!JWT_SECRET) throw new Error("JWT_SECRET debe estar definido en .env");

  const payload: TokenPayload = {
    id: user.id,
    role: user.role,
    email: user.email,
    hermandadId: hermandad.id,
    username: user.username
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};


