-- Obra: modelo definitivo (Docs/nucleo-compartido.md §4). Migración con backfill
-- de datos para `codigo` (obligatorio/único) y `activo` -> `estado`.

-- Enum de estado de obra
CREATE TYPE "EstadoObra" AS ENUM ('SIN_INICIAR', 'EN_EJECUCION', 'SUSPENDIDA', 'TERMINADA');

-- Nuevas columnas de Obra (codigo nullable de momento para poder backfillear)
ALTER TABLE "Obra" ADD COLUMN "codigo" TEXT;
ALTER TABLE "Obra" ADD COLUMN "mandante" TEXT;
ALTER TABLE "Obra" ADD COLUMN "fechaTerminoEstimada" TIMESTAMP(3);
ALTER TABLE "Obra" ADD COLUMN "estado" "EstadoObra" NOT NULL DEFAULT 'SIN_INICIAR';
ALTER TABLE "Obra" ADD COLUMN "actualizadoEn" TIMESTAMP(3);
ALTER TABLE "Obra" ADD COLUMN "actualizadoPor" TEXT;
ALTER TABLE "Obra" ADD COLUMN "eliminadoPor" TEXT;

-- Backfill: codigo determinístico y único; estado desde el antiguo `activo`
UPDATE "Obra" SET "codigo" = 'OBRA-' || "id" WHERE "codigo" IS NULL;
UPDATE "Obra" SET "estado" = 'EN_EJECUCION' WHERE "activo" = true;
UPDATE "Obra" SET "estado" = 'SUSPENDIDA' WHERE "activo" = false;

-- codigo pasa a obligatorio + único; se elimina `activo`
ALTER TABLE "Obra" ALTER COLUMN "codigo" SET NOT NULL;
CREATE UNIQUE INDEX "Obra_codigo_key" ON "Obra"("codigo");
ALTER TABLE "Obra" DROP COLUMN "activo";

-- UsuarioObra: auditoría + soft delete
ALTER TABLE "UsuarioObra" ADD COLUMN "creadoPor" TEXT;
ALTER TABLE "UsuarioObra" ADD COLUMN "eliminadoEn" TIMESTAMP(3);
ALTER TABLE "UsuarioObra" ADD COLUMN "eliminadoPor" TEXT;

-- UsuarioObra: varios titulares por rol (unique pasa a incluir usuarioId)
DROP INDEX "UsuarioObra_obraId_rolObra_key";
CREATE UNIQUE INDEX "UsuarioObra_obraId_rolObra_usuarioId_key" ON "UsuarioObra"("obraId", "rolObra", "usuarioId");
