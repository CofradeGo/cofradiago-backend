-- CreateTable
CREATE TABLE "Cargo" (
    "id" SERIAL NOT NULL,
    "cofradiaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cargo_cofradiaId_nombre_key" ON "Cargo"("cofradiaId", "nombre");

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_cofradiaId_fkey" FOREIGN KEY ("cofradiaId") REFERENCES "Cofradia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
