import type { Request, Response } from "express";
import { cargoService } from "../services/cargo.service.ts";
import type { User } from "../models/user.model.ts";

/**
 * POST /api/v1/cofradias/:cofradiaId/cargos
 * @description Crear un nuevo cargo en una cofradía
 */
export const crearCargo = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;

    // 🔐 Autenticación
    if (!user) {
      return res.status(401).json({
        message: "Usuario no autenticado. Por favor, inicia sesión.",
      });
    }

    // 🛑 Autorización
    if (user.role !== "DMG") {
      return res.status(403).json({
        message: "Acceso denegado. Solo usuarios con rol DMG pueden crear cargos.",
      });
    }

    const { cofradiaId } = req.params;
    const { nombre } = req.body;

    // 📥 Validaciones básicas
    if (!cofradiaId || !nombre) {
      return res.status(400).json({
        message: "Datos incompletos: se requiere cofradía y nombre del cargo.",
      });
    }

    const cargo = await cargoService.crearCargo({
      cofradiaId: Number(cofradiaId),
      nombre,
    });

    return res.status(201).json({
      message: `Cargo "${cargo.nombre}" creado correctamente en la cofradía.`,
      cargo,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.message) {
        case "COFRADIA_NOT_FOUND":
          return res.status(404).json({
            message: "Cofradía no encontrada",
          });

        case "COFRADIA_CERRADA":
          return res.status(400).json({
            message: "No se pueden crear cargos en cofradías cerradas",
          });

        default:
          if (error.message.includes("Ya existe un cargo")) {
            return res.status(409).json({
              message: error.message,
            });
          }

          console.error("Error al crear cargo:", error);
          return res.status(500).json({
            message: `Error al crear el cargo: ${error.message}`,
          });
      }
    }

    console.error("Error desconocido al crear cargo:", error);
    return res.status(500).json({
      message: "Error desconocido al crear el cargo.",
    });
  }
};

/**
 * GET /api/v1/cofradias/:cofradiaId/cargos
 * @description Listar cargos de una cofradía
 */
export const listCargos = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;

    // 🔐 Autenticación
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

    const cargos = await cargoService.listCargosByCofradia(
      Number(cofradiaId)
    );

    return res.status(200).json(cargos);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error al listar cargos:", error);
      return res.status(500).json({
        message: `Error al listar los cargos: ${error.message}`,
      });
    }

    console.error("Error desconocido al listar cargos:", error);
    return res.status(500).json({
      message: "Error desconocido al listar los cargos.",
    });
  }
};
