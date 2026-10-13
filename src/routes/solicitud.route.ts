import { Router } from "express";
import * as solicitudController from "../controllers/solicitud.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router({ mergeParams: true });

/**
 * Peticiones de sitio de una cofradía.
 *
 * `:clase` es `puestos`, `insignias` o `cargos`. Las tres hacen lo
 * mismo, así que comparten controller: lo que cambia es qué tabla se
 * toca, y eso lo decide un parámetro en vez de repetir el fichero tres
 * veces.
 *
 * Solo DMG las registra y decide. Que las meterlas sea de una u otra
 * persona se verá en el módulo de papeleta de sitio, cuando el hermano
 * tenga su propio acceso.
 */

// Antes que "/:cortejoId/solicitudes/:clase/:id" para que Express no
// lea "puestos" como si fuera el id de una petición.
router.get(
  "/:cortejoId/solicitudes",
  authMiddleware,
  solicitudController.listar,
);

router.post(
  "/:cortejoId/solicitudes/:clase",
  authMiddleware,
  solicitudController.registrar,
);
router.patch(
  "/:cortejoId/solicitudes/:clase/:id",
  authMiddleware,
  solicitudController.cambiarEstado,
);
router.delete(
  "/:cortejoId/solicitudes/:clase/:id",
  authMiddleware,
  solicitudController.borrar,
);

export default router;
