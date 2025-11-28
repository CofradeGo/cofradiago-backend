import type { Hermandad } from "./hermandad.model.ts";
import type { UserRole as PrismaUserRole } from "@prisma/client";

export type UserRole = PrismaUserRole;

export interface User {
  id: number;
  username: string;
  password: string;
  role: UserRole;
  email?: string | null;
  hermandadId: number; // FK hacia Hermandad
  hermandad?: Hermandad; // relación opcional
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}