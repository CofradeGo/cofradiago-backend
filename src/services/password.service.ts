import { prisma } from "../config/prismaClient.ts";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Duración del token
const RESET_TOKEN_EXPIRATION = 1000 * 60 * 60; // 1 hora

export class PasswordService {
  /**
   * Genera un token de reseteo para un usuario dado.
   * Devuelve el token en texto plano (para enviarlo por email) y lo guarda hasheado en BD
   */
  static async createResetToken(username: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error("USER_NOT_FOUND");

    // Generar token aleatorio
    const token = crypto.randomBytes(32).toString("hex");

    // Hashear token antes de guardar en la DB
    const hashedToken = await bcrypt.hash(token, 10);

    // Guardar token en BD con relación al usuario y expiración
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: hashedToken,
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRATION),
        user: { connect: { id: user.id } },
      },
    });

    return token; // Este token se envía al usuario por email
  }

  /**
   * Resetea la contraseña del usuario usando un token
   */
  static async resetPassword(token: string, newPassword: string) {
    // Buscar tokens activos
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: { gte: new Date() },
      },
      include: { user: true },
    });

    // Encontrar el token válido comparando con el hasheado
    const matchedToken = await Promise.all(
      resetTokens.map(async (t) => {
        const isValid = await bcrypt.compare(token, t.tokenHash);
        return isValid ? t : null;
      })
    ).then((results) => results.find((t) => t !== null));

    if (!matchedToken) throw new Error("INVALID_OR_EXPIRED_TOKEN");

    const user = matchedToken!.user;

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Borrar todos los tokens de reseteo del usuario (para seguridad)
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    return { message: "Contraseña actualizada correctamente" };
  }
}
