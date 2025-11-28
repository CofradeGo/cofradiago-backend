import type { User } from "./user.model.ts";

export interface Hermandad {
  id: number;
  name: string;
  domain: string;
  officialEmail?: string | null;
  users?: Partial<User>[] | null; // relacional, opcional para cargas parciales

  createdAt: Date;
  updatedAt: Date;
}
