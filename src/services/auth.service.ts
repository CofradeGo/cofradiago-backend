// auth.service.ts
import { prisma } from "../config/prismaClient.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { JWT_SECRET } from "../config/index.ts";
import type { User, UserRole } from "../models/user.model.ts";

interface TokenPayload {
  id: number;
  role: UserRole;
  email?: string | null | undefined;
  hermandadId: number;
  username: string;
}

// ---------------- Utils Refresh Token ----------------

export const generateRefreshToken = (length = 64): string => {
  return crypto.randomBytes(length).toString("hex");
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const createRefreshToken = async (
  userId: number,
  deviceInfo?: string,
  ip?: string,
  expiresInDays = 30
): Promise<string> => {
  const plainToken = generateRefreshToken();
  const tokenHash = hashToken(plainToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      deviceInfo: deviceInfo ?? null,
      ip: ip ?? null,
      expiresAt,
    },
  });

  return plainToken;
};

// ---------------- LOGIN ----------------

export const loginService = async (
  domain: string,
  username: string,
  password: string,
  deviceInfo?: string,
  ip?: string
): Promise<{ accessToken: string; refreshToken: string }> => {
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

  if (!user.isActive) throw new Error("USER_INACTIVE");

  const payload: TokenPayload = {
    id: user.id,
    role: user.role,
    email: user.email,
    hermandadId: hermandad.id,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET!, { expiresIn: "1h" });

  const refreshToken = await createRefreshToken(user.id, deviceInfo, ip);

  return { accessToken, refreshToken };
};

// ---------------- REFRESH TOKEN ----------------

export const refreshTokenService = async (
  token: string,
  deviceInfo?: string,
  ip?: string
): Promise<{ accessToken: string; newRefreshToken?: string }> => {
  const tokenHash = hashToken(token);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!storedToken) throw new Error("INVALID_REFRESH_TOKEN");

  const user = storedToken.user;

  if (!user.isActive) throw new Error("USER_INACTIVE");

  const payload: TokenPayload = {
    id: user.id,
    role: user.role,
    email: user.email,
    hermandadId: user.hermandadId,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET!, { expiresIn: "1h" });

  const newRefreshToken = await createRefreshToken(user.id, deviceInfo, ip);

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  return { accessToken, newRefreshToken };
};
