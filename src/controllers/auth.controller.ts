// auth.controller.ts
import type { Request, Response } from "express";
import {
  loginService,
  logoutService,
  refreshTokenService,
} from "../services/auth.service.ts";

interface LoginRequestParams {
  domain: string;
}

interface LoginRequestBody {
  username: string;
  password: string;
}

// ---------------- LOGIN ----------------
export const login = async (
  req: Request<LoginRequestParams, unknown, LoginRequestBody>,
  res: Response
) => {
  const { username, password } = req.body;
  const { domain } = req.params;

  const deviceInfo = req.headers["user-agent"] ?? undefined;
  const ip = req.ip ?? undefined;

  try {
    const { accessToken, refreshToken } = await loginService(
      domain,
      username,
      password,
      deviceInfo,
      ip
    );

    // Guardar refresh token en cookie httpOnly
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // poner false solo en desarrollo si no usas HTTPS
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      path: "/",
    });

    // Devolver solo accessToken en JSON
    return res.status(200).json({ accessToken });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("LOGIN_ERROR");
    return res.status(400).json({
      error: err.message,
    });
  }
};

// ---------------- REFRESH TOKEN ----------------
export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Leer refresh token desde cookie
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "REFRESH_TOKEN_REQUIRED" });
    }

    const deviceInfo = req.headers["user-agent"] ?? undefined;
    const ip = req.ip;

    const { accessToken, newRefreshToken } = await refreshTokenService(
      token,
      deviceInfo,
      ip
    );

    // Rotar refresh token si se generó uno nuevo
    if (newRefreshToken) {
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true, // false solo en desarrollo si no usas HTTPS
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });
    }

    return res.status(200).json({ accessToken });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("REFRESH_TOKEN_ERROR");
    return res.status(401).json({
      error: err.message,
    });
  }
};

// ---------------- LOGOUT ----------------
export const logoutController = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Recogemos la cookie refreshToken
    const refreshToken = req.cookies?.refreshToken;

    // 2️⃣ Llamamos al service para eliminarlo
    await logoutService(refreshToken, req.headers["user-agent"], req.ip);

    // 3️⃣ Borramos la cookie en el navegador
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // 4️⃣ Respondemos OK
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout controller error:", error);
    return res.status(500).json({ message: "Logout failed" });
  }
};
