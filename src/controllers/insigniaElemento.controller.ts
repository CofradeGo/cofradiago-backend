import type { Request, Response } from "express";
import { insigniaElementoService } from "../services/insigniaElemento.service.ts";
import type { User } from "../models/user.model.ts";

/* =====================================================
   TIPOS DE BODY
===================================================== */
interface CrearElementoBody {
  tipo: string;
  cantidad?: number;
}

interface EditarElementoBody {
  tipo?: string;
  cantidad?: number;
}

/* =====================================================
   CREAR ELEMENTO DE INSIGNIA
===================================================== */
export const crearElemento = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo DMG puede crear elementos." });

    const { insigniaId } = req.params;
    const { tipo, cantidad } = req.body as CrearElementoBody;

    if (!insigniaId || !tipo) {
      return res.status(400).json({ message: "Parámetros obligatorios: insigniaId y tipo." });
    }

    // Garantizar que cantidad siempre sea un número
    const elemento = await insigniaElementoService.crearElemento({
      insigniaId: Number(insigniaId),
      tipo,
      cantidad: cantidad ?? 1, // si no viene, por defecto 1
    });

    return res.status(201).json({
      message: `Elemento "${elemento.tipo}" creado correctamente.`,
      elemento,
    });
  } catch (error: unknown) {
    console.error("Error al crear elemento de insignia:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "INSIGNIA_NOT_FOUND":
          return res.status(404).json({ message: "Insignia no encontrada." });

        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "No se pueden crear elementos en cofradías cerradas." });

        default:
          return res.status(500).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Error interno al crear elemento de insignia." });
  }
};

/* =====================================================
   LISTAR ELEMENTOS DE UNA INSIGNIA
===================================================== */
export const listElementos = async (req: Request, res: Response) => {
  try {
    const { insigniaId } = req.params;
    if (!insigniaId) return res.status(400).json({ message: "insigniaId obligatorio." });

    const elementos = await insigniaElementoService.listElementosByInsignia(Number(insigniaId));
    return res.status(200).json(elementos);
  } catch (error) {
    console.error("Error al listar elementos:", error);
    return res.status(500).json({ message: "Error al listar los elementos de la insignia." });
  }
};

/* =====================================================
   EDITAR ELEMENTO DE INSIGNIA
===================================================== */
export const editarElemento = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo DMG puede editar elementos." });

    const { elementoId } = req.params;
    const { tipo, cantidad } = req.body as EditarElementoBody;

    if (!elementoId) return res.status(400).json({ message: "elementoId obligatorio." });

    const elemento = await insigniaElementoService.editarElemento({
      elementoId: Number(elementoId),
      ...(tipo && { tipo }),
      ...(cantidad !== undefined && { cantidad }), // solo incluir si viene
    });

    return res.status(200).json({
      message: "Elemento actualizado correctamente.",
      elemento,
    });
  } catch (error: unknown) {
    console.error("Error al editar elemento de insignia:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "ELEMENTO_NOT_FOUND":
          return res.status(404).json({ message: "Elemento no encontrado." });

        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "No se pueden editar elementos en cofradías cerradas." });

        default:
          return res.status(500).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Error interno al editar elemento de insignia." });
  }
};

/* =====================================================
   BORRAR ELEMENTO DE INSIGNIA
===================================================== */
export const borrarElemento = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    if (!user) return res.status(401).json({ message: "Usuario no autenticado." });
    if (user.role !== "DMG") return res.status(403).json({ message: "Solo DMG puede borrar elementos." });

    const { elementoId } = req.params;
    if (!elementoId) return res.status(400).json({ message: "elementoId obligatorio." });

    await insigniaElementoService.borrarElemento(Number(elementoId));

    return res.status(200).json({ message: "Elemento eliminado correctamente." });
  } catch (error: unknown) {
    console.error("Error al borrar elemento de insignia:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "ELEMENTO_NOT_FOUND":
          return res.status(404).json({ message: "Elemento no encontrado." });

        case "COFRADIA_CERRADA":
          return res.status(400).json({ message: "No se pueden borrar elementos en cofradías cerradas." });

        default:
          return res.status(500).json({ message: error.message });
      }
    }

    return res.status(500).json({ message: "Error interno al borrar elemento de insignia." });
  }
};
