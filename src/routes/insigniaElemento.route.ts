import { Router } from "express";
import * as insigniaElementoController from "../controllers/insigniaElemento.controller.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router({ mergeParams: true });

// ================= CREAR ELEMENTO =================
// POST /insignias/:insigniaId/elementos
router.post(
  "/insignias/:insigniaId/elementos",
  authMiddleware,
  insigniaElementoController.crearElemento
);

// ================= LISTAR ELEMENTOS =================
// GET /insignias/:insigniaId/elementos
router.get(
  "/insignias/:insigniaId/elementos",
  authMiddleware,
  insigniaElementoController.listElementos
);

// ================= EDITAR ELEMENTO =================
// PUT /elementos/:elementoId
router.put(
  "/elementos/:elementoId",
  authMiddleware,
  insigniaElementoController.editarElemento
);

// ================= BORRAR ELEMENTO =================
// DELETE /elementos/:elementoId
router.delete(
  "/elementos/:elementoId",
  authMiddleware,
  insigniaElementoController.borrarElemento
);

export default router;
