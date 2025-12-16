import nodemailer from "nodemailer";

export class MailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendResetPasswordEmail(
    to: string,
    resetUrl: string
  ) {
    await this.transporter.sendMail({
      from: `"CofradeGo" <${process.env.SMTP_FROM}>`,
      to,
      subject: "Restablecer contraseña",
      html: `
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>
          <a href="${resetUrl}">
            Haz clic aquí para crear una nueva contraseña
          </a>
        </p>
        <p>Este enlace caduca en 1 hora.</p>
        <p>Si no has sido tú, ignora este email.</p>
      `,
    });
  }
}
