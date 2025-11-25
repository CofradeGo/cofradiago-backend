import { prisma } from "../config/prismaClient.ts";

export const getAllTests = async () => {
  return await prisma.test.findMany();
};
