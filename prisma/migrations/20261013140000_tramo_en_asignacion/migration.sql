-- La asignación de un hermano a un puesto pasa a saber en qué tramo
-- está. Sin esto, "Cirios" acumula la gente de todos los tramos donde
-- aparece y cada tramo enseña a los mismos.
ALTER TABLE "PuestoHermano" ADD COLUMN "tramoId" INTEGER;

-- Las filas cargadas con la migración anterior no tienen tramo: se
-- borran. Son datos de ejemplo, no de producción.
DELETE FROM "PuestoHermano" WHERE "tramoId" IS NULL;

ALTER TABLE "PuestoHermano" ALTER COLUMN "tramoId" SET NOT NULL;

ALTER TABLE "PuestoHermano" ADD CONSTRAINT "PuestoHermano_tramoId_fkey"
    FOREIGN KEY ("tramoId") REFERENCES "Tramo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PuestoHermano_tramoId_idx" ON "PuestoHermano"("tramoId");
