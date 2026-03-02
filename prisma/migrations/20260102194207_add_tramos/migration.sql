-- CreateTable
CREATE TABLE "Tramo" (
    "id" SERIAL NOT NULL,
    "cofradiaId" INTEGER NOT NULL,
    "cortejoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tramo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tramo" ADD CONSTRAINT "Tramo_cofradiaId_fkey" FOREIGN KEY ("cofradiaId") REFERENCES "Cofradia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tramo" ADD CONSTRAINT "Tramo_cortejoId_fkey" FOREIGN KEY ("cortejoId") REFERENCES "Cortejo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
