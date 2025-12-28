import type { Request, Response } from "express";
import { cofradiaService, type ListCofradiasOptions } from "../services/cofradia.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias
 * @description Crea una nueva cofradía asociada a la hermandad del usuario autenticado
 * @param req
 * @param res
 * @returns Cofradía creada
 */
export const crearCofradia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;

    if (!user) {
      return res.status(401).json({
        message: "Usuario no autenticado. Por favor, inicia sesión.",
      });
    }

    if (user.role !== "DMG") {
      return res.status(403).json({
        message: "Acceso denegado. Solo usuarios con rol DMG pueden crear cofradías.",
      });
    }

    const { nombre, anio, tipo } = req.body;

    if (!nombre || !anio || !tipo) {
      return res.status(400).json({
        message: "Datos incompletos: se requiere nombre, año y tipo de cofradía.",
      });
    }

    const cofradia = await cofradiaService.crearCofradia({
      hermandadId: user.hermandadId,
      nombre,
      anio,
      tipo,
    });

    return res.status(201).json({
      message: `Cofradía "${cofradia.nombre}" creada correctamente para el año ${cofradia.anio}.`,
      cofradia,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Ya existe una cofradía")) {
        return res.status(409).json({ message: error.message });
      }
      console.error("Error al crear cofradía:", error);
      return res.status(500).json({ message: `Error al crear la cofradía: ${error.message}` });
    }

    console.error("Error desconocido al crear cofradía:", error);
    return res.status(500).json({ message: "Error desconocido al crear la cofradía." });
  }
};

/**
 * GET /api/v1/cofradias
 * @description Listar cofradías de la hermandad del usuario autenticado
 */
export const listCofradias = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;

    if (!user) {
      return res.status(401).json({
        message: "Usuario no autenticado. Por favor, inicia sesión.",
      });
    }

    // Tomamos parámetros de query opcionales
    const orderQuery: "asc" | "desc" = (req.query.order as "asc" | "desc") || "desc";
    const estadoQuery: "ABIERTA" | "CERRADA" | undefined =
      req.query.estado as "ABIERTA" | "CERRADA" | undefined;

    // Creamos opciones tipadas para el service
    const options: ListCofradiasOptions = {
      hermandadId: user.hermandadId,
      order: orderQuery,
      ...(estadoQuery !== undefined && { estado: estadoQuery }),
    };

    const cofradias = await cofradiaService.listCofradias(options);

    return res.status(200).json(cofradias);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error al listar cofradías:", error);
      return res.status(500).json({ message: `Error al listar cofradías: ${error.message}` });
    }

    console.error("Error desconocido al listar cofradías:", error);
    return res.status(500).json({ message: "Error desconocido al listar cofradías." });
  }
};
