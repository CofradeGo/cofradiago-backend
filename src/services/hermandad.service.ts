import {prisma} from "../config/prismaClient.ts";
import type { User } from "../models/user.model.ts";
import type { Hermandad, UpdateHermandadDTO } from "../models/hermandad.model.ts";
const APP_URL = process.env.STORAGE_BASE || process.env.APP_URL;
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
    logoUrl: `${APP_URL}${hermandad.logoUrl}`,
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
export const getPublicInfoHdad = async function getPublicInfoHdad(domain: string) {
  const cleanDomain = domain.trim().toLowerCase();
  const APP_URL = process.env.APP_URL; // <- IMPORTANTE

  const hermandad = await prisma.hermandad.findUnique({
    where: { domain: cleanDomain },
    select: {
      name: true,
      domain: true,
      logoUrl: true,
    },
  });

  if (!hermandad) {
    throw new Error("HERMANDAD_NOT_FOUND");
  }

  // Transformamos el objeto antes de devolverlo
  return {
    ...hermandad,
    logoUrl: hermandad.logoUrl
      ? `${APP_URL}${hermandad.logoUrl}`
      : null,
  };
};


export const updateHermandad = async (
  domain: string,
  user: User,
  data: UpdateHermandadDTO & { logoUrl?: string | null }
) => {
  const hermandad = await prisma.hermandad.findUnique({
    where: { domain },
    include: { users: true },
  });

  if (!hermandad) throw new Error("HERMANDAD_NOT_FOUND");

  // Solo el DMG puede modificar su hermandad
  const dmUser = hermandad.users.find(
    (u) => u.id === user.id && u.role === "DMG"
  );
  if (!dmUser) throw new Error("ACCESS_DENIED");

  // Construimos dinámicamente qué campos actualizar
  const updateData: Record<string, unknown> = {
    name: data.name ?? hermandad.name,
    officialEmail: data.officialEmail ?? hermandad.officialEmail,
  };

  // 👇 Añadimos el logo **solo** si viene definido en el update
  if (typeof data.logoUrl === "string") {
    updateData.logoUrl = data.logoUrl;
  }

  const updatedHermandad = await prisma.hermandad.update({
    where: { id: hermandad.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      domain: true,
      officialEmail: true,
      logoUrl: true,
      users: {
        select: { id: true, username: true, role: true, email: true },
      },
    },
  });

  return updatedHermandad;
};

