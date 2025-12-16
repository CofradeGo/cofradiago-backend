import { prisma } from "../config/prismaClient.ts";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { MailService } from "./mail.service.ts";

const RESET_TOKEN_EXPIRATION = 1000 * 60 * 60; // 1 hora

export class PasswordService {
  /**
   * Genera un token de reseteo y envía el email
   */
  static async createResetToken(username: string, domain: string): Promise<void> {
    // 1️⃣ Buscar usuario que pertenezca a la hermandad
    const user = await prisma.user.findFirst({
      where: {
        username,
        hermandad: {
          domain
        }
      },
      include: {
        hermandad: {
          select: { domain: true }
        }
      }
    });

    // 2️⃣ No revelar si no existe
    if (!user || !user.email) return;

    // 3️⃣ Generar token aleatorio
    const token = crypto.randomBytes(32).toString("hex");

    // 4️⃣ Hashear token
    const hashedToken = await bcrypt.hash(token, 10);

    // 5️⃣ Guardar token en BD
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: hashedToken,
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRATION),
        user: { connect: { id: user.id } },
      },
    });

    // 6️⃣ Construir URL con domain de la hermandad
    const resetUrl = `${process.env.FRONTEND_URL}/${user.hermandad.domain}/reset-password?token=${token}`;

    // 7️⃣ Enviar email
    await MailService.sendResetPasswordEmail(user.email, resetUrl);
  }

  /**
   * Resetea la contraseña del usuario usando un token
   */
  static async resetPassword(token: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new Error("WEAK_PASSWORD");
    }

    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: { gte: new Date() },
      },
      include: { user: true },
    });

    const matchedToken = await Promise.all(
      resetTokens.map(async (t) => {
        const isValid = await bcrypt.compare(token, t.tokenHash);
        return isValid ? t : null;
      })
    ).then((results) => results.find(Boolean));

    if (!matchedToken) throw new Error("INVALID_OR_EXPIRED_TOKEN");

    const user = matchedToken!.user;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    return { message: "Contraseña actualizada correctamente" };
  }
}
