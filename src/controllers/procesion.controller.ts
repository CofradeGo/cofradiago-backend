import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { procesionService } from "../services/procesion.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * GET /api/v1/cofradias/:cofradiaId/cortejos/:cortejoId/procesion
 *
 * El cortejo con sus tramos, los puestos de cada tramo y los hermanos
 * que los ocupan. Es lo que pinta la vista "Ver Cortejos".
 *
 * Lo pueden pedir DMG y AUXILIAR: consultar la procesión es de leer.
 */
export const obtenerProcesion = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;
  if (!user)
    throw new AppError("ACCESS_DENIED", {
      message: "Usuario no autenticado.",
    });

  const { cofradiaId, cortejoId } = req.params;
  if (!cofradiaId || !cortejoId) throw new AppError("NO_VALID_FIELDS");

  const procesion = await procesionService.obtenerProcesion(
    Number(cofradiaId),
    Number(cortejoId),
  );

  return res.status(200).json(procesion);
};
