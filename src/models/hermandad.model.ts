import type { User } from "./user.model.ts";

export interface UpdateHermandadDTO {
  name?: string | null | undefined;
  officialEmail?: string | null | undefined;
  domain?: string | null | undefined;
  logoUrl?: string | null | undefined;
}

export interface HermandadResponseDTO {
  id: number;
  name: string;
  domain: string;
  officialEmail?: string | null;
  users: { id: number; username: string; role: string; email?: string | null }[];
}

export interface Hermandad {
  id: number;
  name: string;
  domain: string;
  officialEmail?: string | null;
  users?: Partial<User>[] | null; // relacional, opcional para cargas parciales
  logoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
