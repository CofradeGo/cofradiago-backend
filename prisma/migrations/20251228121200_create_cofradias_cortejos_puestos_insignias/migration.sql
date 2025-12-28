-- CreateEnum
CREATE TYPE "CofradiaEstado" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateTable
CREATE TABLE "Cofradia" (
    "id" SERIAL NOT NULL,
    "hermandadId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" "CofradiaEstado" NOT NULL DEFAULT 'ABIERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cofradia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cortejo" (
    "id" SERIAL NOT NULL,
    "cofradiaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cortejo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Puesto" (
    "id" SERIAL NOT NULL,
    "cofradiaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Puesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insignia" (
    "id" SERIAL NOT NULL,
    "cofradiaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insignia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cofradia_hermandadId_nombre_anio_key" ON "Cofradia"("hermandadId", "nombre", "anio");

-- AddForeignKey
ALTER TABLE "Cortejo" ADD CONSTRAINT "Cortejo_cofradiaId_fkey" FOREIGN KEY ("cofradiaId") REFERENCES "Cofradia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Puesto" ADD CONSTRAINT "Puesto_cofradiaId_fkey" FOREIGN KEY ("cofradiaId") REFERENCES "Cofradia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insignia" ADD CONSTRAINT "Insignia_cofradiaId_fkey" FOREIGN KEY ("cofradiaId") REFERENCES "Cofradia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
