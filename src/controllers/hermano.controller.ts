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

      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "20");
      const order = (req.query.order as string) === "desc" ? "desc" : "asc";

      // Llamamos al service pasando el hermandadId del usuario
      const result = await hermanoService.listHermanos({
        hermandadId: user.hermandadId,
        page,
        limit,
        order,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error al listar hermanos" });
    }
  },
};
