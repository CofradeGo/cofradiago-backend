-- Un tramo forma parte de su cortejo. La relación era restrictiva, así
-- que borrar un cortejo con tramos dentro fallaba con "Foreign key
-- constraint violated on Tramo_cortejoId_fkey".
--
-- En cascada, y arrastrando también PuestoTramo y PuestoHermano: quién
-- ocupa un puesto en un tramo que ya no existe no significa nada.
ALTER TABLE "Tramo" DROP CONSTRAINT "Tramo_cortejoId_fkey";
ALTER TABLE "Tramo" ADD CONSTRAINT "Tramo_cortejoId_fkey"
    FOREIGN KEY ("cortejoId") REFERENCES "Cortejo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
