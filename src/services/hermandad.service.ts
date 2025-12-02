import {prisma} from "../config/prismaClient.ts";
import type { User } from "../models/user.model.ts";
import type { Hermandad, HermandadResponseDTO, UpdateHermandadDTO } from "../models/hermandad.model.ts";

/**
 * Get all info for the Hermandad
 * @param domain 
 * @param user 
 * @returns 
 */
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

/**
 * Get hdad name only for public
 * @param domain 
 * @returns 
 */
export const getPublicInfoHdad = async function name(domain: string) {
  const cleanDomain = domain.trim().toLowerCase();

  // Buscar solo los campos PUBLICABLES
  const hermandad = await prisma.hermandad.findUnique({
    where: { domain: cleanDomain },
    select: {
      name: true,
      domain: true,
      //INLCUIR AQUI EL LOGO DE LA HDAD
    },
  });

  if (!hermandad) {
    throw new Error("HERMANDAD_NOT_FOUND");
  }

  return hermandad;

};

export const updateHermandad = async (
  domain: string,
  user: User,
  data: UpdateHermandadDTO
): Promise<HermandadResponseDTO> => {
  const hermandad = await prisma.hermandad.findUnique({
    where: { domain },
    include: { users: true },
  });

  if (!hermandad) throw new Error("HERMANDAD_NOT_FOUND");

  // Solo el DMG de la hermandad puede actualizar
  const dmUser = hermandad.users.find((u) => u.id === user.id && u.role === "DMG");
  if (!dmUser) throw new Error("ACCESS_DENIED");

  // Actualizamos solo los campos que se pasen
  const updatedHermandad = await prisma.hermandad.update({
    where: { id: hermandad.id },
    data: {
      name: data.name ?? hermandad.name,
      officialEmail: data.officialEmail ?? hermandad.officialEmail,
    },
    select: {
      id: true,
      name: true,
      domain: true,
      officialEmail: true,
      users: {
        select: { id: true, username: true, role: true, email: true },
      },
    },
  });

  return updatedHermandad;
};

