-- Qué insignias y qué cargos van en cada tramo de la procesión.
--
-- Ambas relaciones son N:M, igual que PuestoTramo: una insignia puede
-- salir en más de un tramo, y un cargo puede repartirse.
CREATE TABLE "InsigniaTramo" (
    "insigniaId" INTEGER NOT NULL,
    "tramoId"    INTEGER NOT NULL,
    CONSTRAINT "InsigniaTramo_pkey" PRIMARY KEY ("insigniaId","tramoId")
);

CREATE TABLE "CargoTramo" (
    "cargoId" INTEGER NOT NULL,
    "tramoId" INTEGER NOT NULL,
    CONSTRAINT "CargoTramo_pkey" PRIMARY KEY ("cargoId","tramoId")
);

CREATE INDEX "InsigniaTramo_tramoId_idx" ON "InsigniaTramo"("tramoId");
CREATE INDEX "CargoTramo_tramoId_idx" ON "CargoTramo"("tramoId");

ALTER TABLE "InsigniaTramo" ADD CONSTRAINT "InsigniaTramo_insigniaId_fkey"
    FOREIGN KEY ("insigniaId") REFERENCES "Insignia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsigniaTramo" ADD CONSTRAINT "InsigniaTramo_tramoId_fkey"
    FOREIGN KEY ("tramoId") REFERENCES "Tramo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CargoTramo" ADD CONSTRAINT "CargoTramo_cargoId_fkey"
    FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CargoTramo" ADD CONSTRAINT "CargoTramo_tramoId_fkey"
    FOREIGN KEY ("tramoId") REFERENCES "Tramo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
