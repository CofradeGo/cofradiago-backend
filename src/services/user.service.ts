import {prisma} from "../config/prismaClient.ts";
import bcrypt from "bcrypt";
import type { User, UpdateUserDTO} from "../models/user.model.ts";


export class UserService {
  static async registerAuxUser(
    dmUser: User,
    data: { username: string; password: string; email?: string }
  ) {
    const { username, password, email } = data;

    // 1. Solo usuarios DMG pueden crear AUX
    if (dmUser.role !== "DMG") {
      throw new Error("No tienes permisos para crear usuarios.");
    }

    // 2. Validaciones simples
    if (!username || !password) {
      throw new Error("Los campos username y password son obligatorios.");
    }

    // 3. Comprobar si el username ya existe
    const userExists = await prisma.user.findUnique({ where: { username } });
    if (userExists) {
      throw new Error("El nombre de usuario ya existe.");
    }

    // 4. Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Crear usuario AUX en la misma hermandad del DMG
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        role: "AUXILIAR", // ENUM Prisma
        hermandadId: dmUser.hermandadId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        hermandadId: true,
        createdAt: true,
      },
    });

    return newUser;
  }

  /**
   * Desactiva un usuario (soft delete)
   * Solo DMG puede hacerlo, nunca sobre sí mismo y solo dentro de la misma hermandad
   */
  static async deactivateUser(dmUser: User, targetUserId: number) {
    // 1. Validar que el DMG existe y tiene rol correcto
    if (dmUser.role !== "DMG") {
      throw new Error("FORBIDDEN_ACTION"); // Código claro y consistente
    }

    // 2. Prevenir que se elimine a sí mismo
    if (dmUser.id === targetUserId) {
      throw new Error("CANNOT_DELETE_SELF");
    }

    // 3. Buscar al usuario objetivo
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new Error("USER_NOT_FOUND");
    }

    // 4. Solo puede eliminar usuarios de su propia hermandad
    if (targetUser.hermandadId !== dmUser.hermandadId) {
      throw new Error("FORBIDDEN_ACTION");
    }

    // 5. Actualizar isActive a false
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        hermandadId: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
  /**
   * Devuelve los usuarios de la hermandad según rol
   */
  static async getUsers(requestingUser: User) {
    if (requestingUser.role === "DMG") {
      // DMG ve todos los usuarios activos de su hermandad
      return prisma.user.findMany({
        where: {
          hermandadId: requestingUser.hermandadId,
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else {
      // AUX solo ve su propio registro
      const user = await prisma.user.findUnique({
        where: { id: requestingUser.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user ? [user] : [];
    }
  }
  /**
   * Update User
   * @param requestingUser 
   * @param data 
   * @returns 
   */
  static async updateUser(
    requestingUser: User,
    dto: UpdateUserDTO
  ) {
    const { username, email, oldPassword, newPassword } = dto;

    // 1. Cargar usuario actual (para validar contraseña)
    const userInDb = await prisma.user.findUnique({
      where: { id: requestingUser.id },
    });

    if (!userInDb) {
      throw new Error("USER_NOT_FOUND");
    }

    // 2. Validar actualización de contraseña
    if (oldPassword || newPassword) {
      if (!oldPassword || !newPassword) {
        throw new Error("PASSWORD_FIELDS_REQUIRED");
      }

      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        userInDb.password
      );

      if (!isOldPasswordValid) {
        throw new Error("INVALID_OLD_PASSWORD");
      }
    }

    // 3. Construir objeto de actualización
    const dataToUpdate: Record<string, unknown> = {};

    if (username) dataToUpdate.username = username;
    if (email !== undefined) dataToUpdate.email = email;

    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      dataToUpdate.password = hashed;
    }

    // Si no hay cambios, devolver error
    if (Object.keys(dataToUpdate).length === 0) {
      throw new Error("NO_FIELDS_TO_UPDATE");
    }

    // 4. Actualizar en BBDD
    const updated = await prisma.user.update({
      where: { id: requestingUser.id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        hermandadId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }
  
}
