-- AlterTable
ALTER TABLE "Insignia" ADD COLUMN     "cortejoId" INTEGER;

-- AddForeignKey
ALTER TABLE "Insignia" ADD CONSTRAINT "Insignia_cortejoId_fkey" FOREIGN KEY ("cortejoId") REFERENCES "Cortejo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
