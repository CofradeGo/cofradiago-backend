import type { Request, Response } from "express";
import * as hermandadService from "../services/hermandad.service.ts";
import type { User } from "../models/user.model.ts";

export const getHermandad = async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;

    // Validación mínima
    if (!domain) {
      return res.status(400).json({ message: "Falta el dominio de la hermandad" });
    }

    // El usuario autenticado viene del middleware
    const user = req.user;

    // Delegamos la lógica al service
    const hermandad = await hermandadService.getHermandadByDomain(domain, user);

    // Respuesta
    return res.status(200).json(hermandad);
  } catch (error: unknown) {
  if (error instanceof Error) {
    if (error.message === "HERMANDAD_NOT_FOUND") {
      return res.status(404).json({ message: "Hermandad no encontrada" });
    } else if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "No tienes permisos para ver esta hermandad" });
    }

    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }

  // Por si el error no es de tipo Error
  console.error("Error desconocido:", error);
  return res.status(500).json({ message: "Error interno del servidor" });
}

};

export const getPublicHdad = async function name(req: Request, res: Response) {
  try {
    const { domain } = req.params;

    if(!domain){
      return res.status(400).json({ message: "Falta el dominio de la hermandad" });
    }
    const nameHdad = await hermandadService.getPublicInfoHdad(domain);
    return res.status(200).json(nameHdad);

  } catch (error: unknown) {
  if (error instanceof Error) {
    if (error.message === "HERMANDAD_NOT_FOUND") {
      return res.status(404).json({ message: "Hermandad no encontrada" });
    } else if (error.message === "FORBIDDEN") {
      return res.status(403).json({ message: "No tienes permisos para ver esta hermandad" });
    }

    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }

  // Por si el error no es de tipo Error
  console.error("Error desconocido:", error);
  return res.status(500).json({ message: "Error interno del servidor" });
}
};

// PUT /api/hermandad/:domain
export const updateHermandad = async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const user = req.user as User; // authMiddleware asegura que existe
    const { name, officialEmail } = req.body;
    // Verificamos que existe el domain.
    if (!domain) {
      return res.status(400).json({ message: "El parámetro domain es obligatorio" });
    }

    const updatedHermandad = await hermandadService.updateHermandad(domain, user, {
      name,
      officialEmail,
    });

    return res.status(200).json({
      message: "Hermandad actualizada correctamente",
      hermandad: updatedHermandad,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "HERMANDAD_NOT_FOUND":
          return res.status(404).json({ message: "Hermandad no encontrada" });
        case "ACCESS_DENIED":
          return res.status(403).json({ message: "No tienes permisos para modificar esta hermandad" });
        default:
          console.error(error);
          return res.status(500).json({ message: "Error interno del servidor" });
      }
    }
    console.error(error);
    return res.status(500).json({ message: "Error desconocido" });
  }
};
