import type { Request, Response } from "express";
import { hermanoService } from "../services/hermano.service.ts";
import type { ListHermanosOptions } from "../services/hermano.service.ts";

export const hermanoController = {
  listHermanos: async (req: Request, res: Response) => {
    try {
      // Usuario autenticado (inyectado por middleware)
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // -------------------------
      // Paginación y orden
      // -------------------------
      const page =
        typeof req.query.page === "string" && !Number.isNaN(Number(req.query.page))
          ? Number(req.query.page)
          : 1;

      const limit =
        typeof req.query.limit === "string" && !Number.isNaN(Number(req.query.limit))
          ? Number(req.query.limit)
          : 20;

      const order = req.query.order === "desc" ? "desc" : "asc";

      // -------------------------
      // Opciones base (obligatorias)
      // -------------------------
      const options: ListHermanosOptions = {
        hermandadId: user.hermandadId,
        page,
        limit,
        order,
      };

      // -------------------------
      // Filtros opcionales
      // -------------------------
      if (typeof req.query.search === "string" && req.query.search.trim()) {
        options.search = req.query.search.trim();
      }

      if (typeof req.query.direccion === "string" && req.query.direccion.trim()) {
        options.direccion = req.query.direccion.trim();
      }

      if (
        typeof req.query.numero_antiguedad === "string" &&
        !Number.isNaN(Number(req.query.numero_antiguedad))
      ) {
        options.numeroAntiguedad = Number(req.query.numero_antiguedad);
      }

      if (
        typeof req.query.edadMin === "string" &&
        !Number.isNaN(Number(req.query.edadMin))
      ) {
        options.edadMin = Number(req.query.edadMin);
      }

      if (
        typeof req.query.edadMax === "string" &&
        !Number.isNaN(Number(req.query.edadMax))
      ) {
        options.edadMax = Number(req.query.edadMax);
      }

      if (typeof req.query.activo === "string") {
        options.activo = req.query.activo === "true";
      }

      // -------------------------
      // Llamada al service
      // -------------------------
      const result = await hermanoService.listHermanos(options);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error listando hermanos:", error);
      return res.status(500).json({ message: "Error al listar hermanos" });
    }
  },
};
