import type { Request, Response } from "express";
import { puestoService } from "../services/puesto.service.ts";
import type { User } from "../models/user.model.ts";

/* =====================================================
   TIPOS DE BODY
===================================================== */

interface CrearPuestoBody {
  nombre: string;
  codigo?: string;
}

interface EditarPuestoBody {
  nombre?: string;
  codigo?: string;
}

/* =====================================================
   CREAR PUESTO
===================================================== */

/**
 * POST /api/v1/cofradias/:cofradiaId/puestos
 */
export const crearPuesto = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) {
      return res.status(401).json({
        message: "Usuario no autenticado. Por favor, inicia sesión.",
      });
    }

    if (user.role !== "DMG") {
      return res.status(403).json({
        message:
          "Acceso denegado. Solo usuarios con rol DMG pueden crear puestos.",
      });
    }

    const { cofradiaId } = req.params;
    const { nombre, codigo } = req.body as CrearPuestoBody;

    if (!cofradiaId || !nombre) {
      return res.status(400).json({
        message:
          "Datos incompletos: se requiere cofradiaId y nombre del puesto.",
      });
    }

    // 🔹 Construcción segura del input
    const input: {
      cofradiaId: number;
      nombre: string;
      codigo?: string;
    } = {
      cofradiaId: Number(cofradiaId),
      nombre,
    };

    if (codigo !== undefined) {
      input.codigo = codigo;
    }

    const puesto = await puestoService.crearPuesto(input);

    return res.status(201).json({
      message: `Puesto "${puesto.nombre}" creado correctamente en la cofradía.`,
      puesto,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada" });

        case "COFRADIA_CERRADA":
          return res.status(400).json({
            message: "No se pueden crear puestos en cofradías cerradas",
          });

        default:
          if (error.message.includes("Ya existe un puesto")) {
            return res.status(409).json({ message: error.message });
          }
      }
    }

    console.error("Error al crear puesto:", error);
    return res.status(500).json({
      message: "Error interno al crear el puesto.",
    });
  }
};

/* =====================================================
   LISTAR PUESTOS
===================================================== */

/**
 * GET /api/v1/cofradias/:cofradiaId/puestos
 */
export const listPuestos = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) {
      return res.status(401).json({
        message: "Usuario no autenticado. Por favor, inicia sesión.",
      });
    }

    const { cofradiaId } = req.params;
    if (!cofradiaId) {
      return res.status(400).json({
        message: "Parámetro cofradiaId obligatorio",
      });
    }

    const puestos = await puestoService.listPuestosByCofradia(
      Number(cofradiaId)
    );

    return res.status(200).json(puestos);
  } catch (error) {
    console.error("Error al listar puestos:", error);
    return res.status(500).json({
      message: "Error al listar los puestos.",
    });
  }
};

/* =====================================================
   EDITAR PUESTO
===================================================== */

/**
 * PUT /api/v1/cofradias/:cofradiaId/puestos/:puestoId
 */
export const editarPuesto = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) {
      return res.status(401).json({ message: "Usuario no autenticado." });
    }

    if (user.role !== "DMG") {
      return res.status(403).json({
        message: "Solo usuarios DMG pueden editar puestos.",
      });
    }

    const { cofradiaId, puestoId } = req.params;
    const { nombre, codigo } = req.body as EditarPuestoBody;

    if (!cofradiaId || !puestoId) {
      return res.status(400).json({
        message: "cofradiaId y puestoId son obligatorios.",
      });
    }

    // 🔹 Construcción segura del input
    const data: {
      nombre?: string;
      codigo?: string;
    } = {};

    if (nombre !== undefined) {
      data.nombre = nombre;
    }

    if (codigo !== undefined) {
      data.codigo = codigo;
    }

    const puesto = await puestoService.editarPuesto(
      Number(puestoId),
      data
    );

    return res.status(200).json({
      message: "Puesto actualizado correctamente.",
      puesto,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "PUESTO_NOT_FOUND":
          return res.status(404).json({ message: "Puesto no encontrado" });

        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada" });

        case "COFRADIA_CERRADA":
          return res.status(400).json({
            message: "No se pueden editar puestos en cofradías cerradas",
          });

        default:
          if (error.message.includes("Ya existe un puesto")) {
            return res.status(409).json({ message: error.message });
          }
      }
    }

    console.error("Error al editar puesto:", error);
    return res.status(500).json({
      message: "Error interno al editar el puesto.",
    });
  }
};

/* =====================================================
   BORRAR PUESTO
===================================================== */

/**
 * DELETE /api/v1/cofradias/:cofradiaId/puestos/:puestoId
 */
export const borrarPuesto = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) {
      return res.status(401).json({ message: "Usuario no autenticado." });
    }

    if (user.role !== "DMG") {
      return res.status(403).json({
        message: "Solo usuarios DMG pueden borrar puestos.",
      });
    }

    const { cofradiaId, puestoId } = req.params;

    if (!cofradiaId || !puestoId) {
      return res.status(400).json({
        message: "cofradiaId y puestoId son obligatorios.",
      });
    }

    await puestoService.borrarPuesto(Number(puestoId));

    return res.status(200).json({
      message: "Puesto eliminado correctamente.",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "PUESTO_NOT_FOUND":
          return res.status(404).json({ message: "Puesto no encontrado" });

        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({ message: "Cofradía no encontrada" });

        case "COFRADIA_CERRADA":
          return res.status(400).json({
            message: "No se pueden borrar puestos en cofradías cerradas",
          });
      }
    }

    console.error("Error al borrar puesto:", error);
    return res.status(500).json({
      message: "Error interno al borrar el puesto.",
    });
  }
};
