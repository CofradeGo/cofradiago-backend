-- Peticiones de sitio: lo que pide un hermano y en qué estado está.
--
-- Lo decide la junta, no quien lo registra: todo empieza en PENDIENTE,
-- así que nadie entra en la procesión sin que alguien lo acepte.

-- Tipo nuevo para las tres tablas de petición.
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

ALTER TABLE "PuestoHermano" ADD COLUMN "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE';
ALTER TABLE "PuestoHermano" ADD COLUMN "notas" TEXT;

CREATE TABLE "InsigniaHermano" (
    "id"         SERIAL NOT NULL,
    "insigniaId" INTEGER NOT NULL,
    "hermanoId"  INTEGER NOT NULL,
    "tramoId"    INTEGER NOT NULL,
    "cofradiaId" INTEGER NOT NULL,
    "estado"     "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "notas"      TEXT,

    CONSTRAINT "InsigniaHermano_pkey" PRIMARY KEY ("id")
);

-- Una persona, una insignia y un tramo por cofradía. Igual que en los
-- puestos: son tres peticiones independientes, no tres campos de una.
CREATE UNIQUE INDEX "InsigniaHermano_insigniaId_hermanoId_key" ON "InsigniaHermano"("insigniaId", "hermanoId");
CREATE UNIQUE INDEX "InsigniaHermano_hermanoId_cofradiaId_key" ON "InsigniaHermano"("hermanoId", "cofradiaId");
CREATE INDEX "InsigniaHermano_cofradiaId_idx" ON "InsigniaHermano"("cofradiaId");
CREATE INDEX "InsigniaHermano_tramoId_idx" ON "InsigniaHermano"("tramoId");
CREATE INDEX "InsigniaHermano_estado_idx" ON "InsigniaHermano"("estado");

CREATE TABLE "CargoHermano" (
    "id"         SERIAL NOT NULL,
    "cargoId"    INTEGER NOT NULL,
    "hermanoId"  INTEGER NOT NULL,
    "tramoId"    INTEGER NOT NULL,
    "cofradiaId" INTEGER NOT NULL,
    "estado"     "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "notas"      TEXT,

    CONSTRAINT "CargoHermano_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CargoHermano_cargoId_hermanoId_key" ON "CargoHermano"("cargoId", "hermanoId");
CREATE UNIQUE INDEX "CargoHermano_hermanoId_cofradiaId_key" ON "CargoHermano"("hermanoId", "cofradiaId");
CREATE INDEX "CargoHermano_cofradiaId_idx" ON "CargoHermano"("cofradiaId");
CREATE INDEX "CargoHermano_tramoId_idx" ON "CargoHermano"("tramoId");
CREATE INDEX "CargoHermano_estado_idx" ON "CargoHermano"("estado");

-- Para.listar lo que está pendiente de decidir sin recorrerlo entero.
CREATE INDEX "PuestoHermano_estado_idx" ON "PuestoHermano"("estado");

ALTER TABLE "InsigniaHermano" ADD CONSTRAINT "InsigniaHermano_insigniaId_fkey"
    FOREIGN KEY ("insigniaId") REFERENCES "Insignia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsigniaHermano" ADD CONSTRAINT "InsigniaHermano_hermanoId_fkey"
    FOREIGN KEY ("hermanoId") REFERENCES "Hermano"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsigniaHermano" ADD CONSTRAINT "InsigniaHermano_tramoId_fkey"
    FOREIGN KEY ("tramoId") REFERENCES "Tramo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CargoHermano" ADD CONSTRAINT "CargoHermano_cargoId_fkey"
    FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CargoHermano" ADD CONSTRAINT "CargoHermano_hermanoId_fkey"
    FOREIGN KEY ("hermanoId") REFERENCES "Hermano"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CargoHermano" ADD CONSTRAINT "CargoHermano_tramoId_fkey"
    FOREIGN KEY ("tramoId") REFERENCES "Tramo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Plazas en las tres clases. Se llama igual en todas porque significa
-- lo mismo: cuántas personas hacen falta en ese tramo.
--
-- La insignia es una pieza única (una sola Cruz de Guía), pero la
-- cargan varias personas, así que lo que se cuenta son los que la
-- llevan.
ALTER TABLE "PuestoTramo" ADD COLUMN "plazas" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "InsigniaTramo" ADD COLUMN "plazas" INTEGER NOT NULL DEFAULT 1;

-- `cantidad` pasa a llamarse `plazas` para que puestos, insignias y
-- cargos hablen el mismo idioma.
ALTER TABLE "CargoTramo" RENAME COLUMN "cantidad" TO "plazas";