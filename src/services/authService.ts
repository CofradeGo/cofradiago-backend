import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET!;
if (!jwtSecret) throw new Error("JWT_SECRET no está definido");

export const authService = {
  generateToken(userId: number) {
    return jwt.sign({ userId }, jwtSecret, { expiresIn: "1h" });
  },

  verifyToken(token: string) {
    return jwt.verify(token, jwtSecret);
  },
};
