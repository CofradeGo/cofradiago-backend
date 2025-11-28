import {prisma} from "../config/prismaClient.ts";
import type { User } from "../models/user.model.ts";
import type { Hermandad } from "../models/hermandad.model.ts";

export const getHermandadByDomain = async (
  domain: string,
  user: User
): Promise<Partial<Hermandad>> => {
  // Buscar la hermandad por dominio
  const hermandad = await prisma.hermandad.findUnique({
    where: { domain },
    include: { users: true }, // traemos los usuarios para verificar rol y pertenencia
  });

  if (!hermandad) {
    throw new Error("HERMANDAD_NOT_FOUND");
  }

  // Verificar que el usuario pertenece a la hermandad
  const pertenece = hermandad.users.some((u) => u.id === user.id);
  if (!pertenece) {
    throw new Error("FORBIDDEN");
  }

  // Devolver solo la info necesaria, sin passwords ni datos sensibles
  return {
    id: hermandad.id,
    name: hermandad.name,
    domain: hermandad.domain,
    officialEmail: hermandad.officialEmail,
    users: hermandad.users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      email: u.email,
    })),
  };
};
