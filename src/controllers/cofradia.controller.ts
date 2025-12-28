import type { Request, Response } from "express";
import { cofradiaService } from "../services/cofradia.service.ts";

export const cofradiaController = {
  crearCofradia: async (req: Request, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado. Por favor, inicia sesión." });
      }

      // Solo usuarios DMG pueden crear cofradías
      if (user.role !== "DMG") {
        return res.status(403).json({ message: "Acceso denegado. Solo usuarios con rol DMG pueden crear cofradías." });
      }

      const { nombre, anio, tipo } = req.body;

      if (!nombre || !anio || !tipo) {
        return res.status(400).json({ message: "Datos incompletos: se requiere nombre, año y tipo de cofradía." });
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
      // Mensajes de error específicos
      if (error instanceof Error) {
        if (error.message.includes("Ya existe una cofradía")) {
          return res.status(409).json({ message: error.message });
        }
        return res.status(500).json({ message: `Error al crear la cofradía: ${error.message}` });
      }

      return res.status(500).json({ message: "Error desconocido al crear la cofradía." });
    }
  },
};
