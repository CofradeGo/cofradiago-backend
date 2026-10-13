-- Cuántas plazas de cada cargo hay en el tramo. Al montar la
-- estructura se sabe el número aunque todavía no se sepa quiénes.
ALTER TABLE "CargoTramo" ADD COLUMN "cantidad" INTEGER NOT NULL DEFAULT 1;
