-- Un puesto puede ocupar varios tramos de una procesión.
CREATE TABLE "PuestoTramo" (
    "puestoId" INTEGER NOT NULL,
    "tramoId"  INTEGER NOT NULL,
    CONSTRAINT "PuestoTramo_pkey" PRIMARY KEY ("puestoId","tramoId")
);

-- Hermanos que ocupan un puesto. `cofradiaId` está desnormalizado para
-- poder exigir un único puesto por hermano y cofradía: Hermano cuelga
-- de la hermandad, así que sin esta columna la restricción no se
-- podría expresar en la base de datos.
CREATE TABLE "PuestoHermano" (
    "id"         SERIAL NOT NULL,
    "puestoId"   INTEGER NOT NULL,
    "hermanoId"  INTEGER NOT NULL,
    "cofradiaId" INTEGER NOT NULL,
    CONSTRAINT "PuestoHermano_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PuestoHermano_puestoId_hermanoId_key" ON "PuestoHermano"("puestoId", "hermanoId");
CREATE UNIQUE INDEX "PuestoHermano_hermanoId_cofradiaId_key" ON "PuestoHermano"("hermanoId", "cofradiaId");
CREATE INDEX "PuestoHermano_cofradiaId_idx" ON "PuestoHermano"("cofradiaId");
CREATE INDEX "PuestoTramo_tramoId_idx" ON "PuestoTramo"("tramoId");

ALTER TABLE "PuestoTramo" ADD CONSTRAINT "PuestoTramo_puestoId_fkey"
    FOREIGN KEY ("puestoId") REFERENCES "Puesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PuestoTramo" ADD CONSTRAINT "PuestoTramo_tramoId_fkey"
    FOREIGN KEY ("tramoId") REFERENCES "Tramo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PuestoHermano" ADD CONSTRAINT "PuestoHermano_puestoId_fkey"
    FOREIGN KEY ("puestoId") REFERENCES "Puesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PuestoHermano" ADD CONSTRAINT "PuestoHermano_hermanoId_fkey"
    FOREIGN KEY ("hermanoId") REFERENCES "Hermano"("id") ON DELETE CASCADE ON UPDATE CASCADE;
