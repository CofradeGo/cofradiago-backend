import type { Request, Response } from "express";
import * as hermandadService from "../services/hermandad.service.ts";

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
