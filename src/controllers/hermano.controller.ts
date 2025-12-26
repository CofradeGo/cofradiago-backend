import type { Request, Response } from "express";
import { hermanoService } from "../services/hermano.service.ts";

export const hermanoController = {
  listHermanos: async (req: Request, res: Response) => {
    try {
      // Obtenemos hermandadId del usuario autenticado (puesto por authMiddleware)
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Parseamos query params con tipado y valores por defecto
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const order = req.query.order === "desc" ? "desc" : "asc";

      // Nuevos filtros opcionales
      const search = req.query.search ? String(req.query.search) : undefined;
      const direccion = req.query.direccion ? String(req.query.direccion) : undefined;
      const numeroAntiguedad = req.query.numero_antiguedad
        ? Number(req.query.numero_antiguedad)
        : undefined;

      // Llamamos al service pasando todos los filtros y el hermandadId
      const result = await hermanoService.listHermanos({
        hermandadId: user.hermandadId,
        page,
        limit,
        order,
        search,
        direccion,
        numeroAntiguedad,
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      console.error(error);
      return res.status(500).json({ message: "Error al listar hermanos" });
    }
  },
};
