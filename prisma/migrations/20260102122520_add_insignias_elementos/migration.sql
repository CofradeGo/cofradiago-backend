/*
  Warnings:

  - You are about to drop the column `cortejoId` on the `Insignia` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cofradiaId,nombre]` on the table `Insignia` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Insignia" DROP CONSTRAINT "Insignia_cortejoId_fkey";

-- AlterTable
ALTER TABLE "Insignia" DROP COLUMN "cortejoId";

-- CreateTable
CREATE TABLE "InsigniaElemento" (
    "id" SERIAL NOT NULL,
    "insigniaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "InsigniaElemento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CortejoToInsignia" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CortejoToInsignia_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CortejoToInsignia_B_index" ON "_CortejoToInsignia"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Insignia_cofradiaId_nombre_key" ON "Insignia"("cofradiaId", "nombre");

-- AddForeignKey
ALTER TABLE "InsigniaElemento" ADD CONSTRAINT "InsigniaElemento_insigniaId_fkey" FOREIGN KEY ("insigniaId") REFERENCES "Insignia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CortejoToInsignia" ADD CONSTRAINT "_CortejoToInsignia_A_fkey" FOREIGN KEY ("A") REFERENCES "Cortejo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CortejoToInsignia" ADD CONSTRAINT "_CortejoToInsignia_B_fkey" FOREIGN KEY ("B") REFERENCES "Insignia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
