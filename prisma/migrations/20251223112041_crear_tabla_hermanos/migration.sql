-- CreateTable
CREATE TABLE "Hermano" (
    "id" SERIAL NOT NULL,
    "hermandadId" INTEGER NOT NULL,
    "numeroAntiguedad" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "fechaAltaHermandad" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hermano_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hermano_hermandadId_numeroAntiguedad_key" ON "Hermano"("hermandadId", "numeroAntiguedad");

-- AddForeignKey
ALTER TABLE "Hermano" ADD CONSTRAINT "Hermano_hermandadId_fkey" FOREIGN KEY ("hermandadId") REFERENCES "Hermandad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
