import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = Router();

// Ruta temporal para probar autenticación
router.get("/private", authMiddleware, (req, res) => {
  return res.json({
    message: "Acceso permitido",
    user: req.user, // <-- viene del middleware
  });
});

export default router;
