import type { Request, Response } from "express";
import { cofradiaService, type ListCofradiasOptions, type ActualizarCofradiaInput } from "../services/cofradia.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias
 */
export const crearCofradia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado. Por favor, inicia sesión." });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo usuarios DMG pueden crear cofradías." });

    const { nombre, anio, tipo } = req.body;
    if (!nombre || !anio || !tipo) return res.status(400).json({ message: "Datos incompletos" });

    const cofradia = await cofradiaService.crearCofradia({ hermandadId: user.hermandadId, nombre, anio, tipo });

    return res.status(201).json({ message: `Cofradía "${cofradia.nombre}" creada correctamente`, cofradia });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Ya existe una cofradía")) return res.status(409).json({ message: error.message });
      console.error("Error al crear cofradía:", error);
      return res.status(500).json({ message: `Error al crear la cofradía: ${error.message}` });
    }
    return res.status(500).json({ message: "Error desconocido al crear la cofradía." });
  }
};

/**
 * GET /api/v1/cofradias
 */
export const listCofradias = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado" });

    const orderQuery: "asc" | "desc" = (req.query.order as "asc" | "desc") || "desc";
    const estadoQuery: "ABIERTA" | "CERRADA" | undefined = req.query.estado as "ABIERTA" | "CERRADA" | undefined;

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
    return res.status(500).json({ message: "Error desconocido al listar cofradías." });
  }
};

export const actualizarCofradia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado" });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo usuarios DMG pueden editar cofradías" });

    const { cofradiaId } = req.params;
    const data: ActualizarCofradiaInput = req.body;

    if (!cofradiaId) return res.status(400).json({ message: "Parámetro cofradía obligatorio" });

    // ✅ Filtramos solo campos válidos
    const validData: ActualizarCofradiaInput = {};
    if (data.nombre && data.nombre.trim() !== "") validData.nombre = data.nombre.trim();
    if (data.anio !== undefined && data.anio !== null) validData.anio = data.anio;
    if (data.tipo && data.tipo.trim() !== "") validData.tipo = data.tipo.trim();

    if (Object.keys(validData).length === 0) {
      return res.status(400).json({ message: "Debe enviar al menos un campo válido para actualizar" });
    }

    const cofradia = await cofradiaService.actualizarCofradia(Number(cofradiaId), validData);
    return res.status(200).json({ message: "Cofradía actualizada correctamente", cofradia });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada" });
        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "No se pueden modificar cofradías cerradas" });
        default:
          console.error("Error al actualizar cofradía:", error);
          return res.status(500).json({ message: `Error al actualizar la cofradía: ${error.message}` });
      }
    }
    return res.status(500).json({ message: "Error desconocido al actualizar la cofradía" });
  }
};



// POST /api/v1/cofradias/:id/clone
export const clonarCofradia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado" });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo usuarios DMG pueden clonar cofradías" });

    const cofradiaId = Number(req.params.cofradiaId);
    const { anioNuevo } = req.body;

    if (!anioNuevo) return res.status(400).json({ message: "Debe indicar el año nuevo para la cofradía clonada" });

    // Llamada al service que ya clona con todas las relaciones
    const nuevaCofradia = await cofradiaService.clonarCofradia({
      cofradiaId,
      anioNuevo: Number(anioNuevo),
    });

    return res.status(201).json({
      message: `Cofradía clonada correctamente para el año ${anioNuevo}`,
      cofradia: nuevaCofradia,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const msg = error.message;

      if (msg.includes("COFRADIA_NOT_FOUND")) {
        return res.status(404).json({ message: "Cofradía original no encontrada" });
      }

      if (msg.includes("Ya existe una cofradía")) {
        return res.status(409).json({ message: msg });
      }

      console.error("Error al clonar cofradía:", error);
      return res.status(500).json({ message: `Error al clonar la cofradía: ${msg}` });
    }

    return res.status(500).json({ message: "Error desconocido al clonar la cofradía" });
  }
};



/**
 * DELETE /api/v1/cofradias/:cofradiaId
 */
export const borrarCofradia = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (user.role !== "DMG") {
      return res
        .status(403)
        .json({ message: "Solo usuarios DMG pueden borrar cofradías" });
    }

    const cofradiaId = Number(req.params.cofradiaId);
    if (isNaN(cofradiaId)) {
      return res.status(400).json({ message: "ID de cofradía inválido" });
    }

    const result = await cofradiaService.borrarCofradia(cofradiaId);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada" });

        case "COFRADIA_CERRADA":
          return res
            .status(409)
            .json({ message: "No se pueden borrar cofradías cerradas" });

        default:
          console.error("Error al borrar cofradía:", error);
          return res.status(500).json({
            message: `Error al borrar la cofradía: ${error.message}`,
          });
      }
    }

    return res
      .status(500)
      .json({ message: "Error desconocido al borrar la cofradía" });
  }
};

