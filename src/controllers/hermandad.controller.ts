import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import * as hermandadService from "../services/hermandad.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * get hermandad info
 * @description Enpoint para devolver los datos de la hdad
 * @param req 
 * @param res 
 * @returns ∫
 */
export const getHermandad = async (req: Request, res: Response) => {
  const { domain } = req.params;

  // Validación mínima
  if (!domain) {
    throw new AppError("NO_VALID_FIELDS", {
      message: "Falta el dominio de la hermandad",
    });
  }

  // El usuario autenticado viene del middleware
  const user = req.user;

  // Delegamos la lógica al service
  const hermandad = await hermandadService.getHermandadByDomain(domain, user);

  // Respuesta
  return res.status(200).json(hermandad);
  

};

export const getPublicHdad = async function name(req: Request, res: Response) {
  const { domain } = req.params;

  if(!domain){
    throw new AppError("NO_VALID_FIELDS", {
      message: "Falta el dominio de la hermandad",
    });
  }
  const nameHdad = await hermandadService.getPublicInfoHdad(domain);
  return res.status(200).json(nameHdad);

  
};

/**
 * UT /api/v1/hermandad/:domain
 * @param req 
 * @param res 
 * @returns 
 */
export const updateHermandad = async (req: Request, res: Response) => {
  const { domain } = req.params;
  const user = req.user as User;

  if (!domain) throw new AppError("NO_VALID_FIELDS", {
      message: "El parámetro domain es obligatorio",
    });

  const { name, officialEmail } = req.body;

  // ✅ Si viene un archivo, Multer lo deja en req.file
  const file = req.file;
  const logoUrl = file ? `/uploads/logos/${file.filename}` : null;

  const updatedHermandad = await hermandadService.updateHermandad(domain, user, {
    name,
    officialEmail,
    logoUrl, // logo opcional
  });

  return res.status(200).json({
    message: "Hermandad actualizada correctamente",
    hermandad: updatedHermandad,
  });
  
};