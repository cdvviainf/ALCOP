-- Programación Técnica (Docs/programacion-prevencion.md v0.2): el calendario agenda
-- formularios de Prevención o de Técnica. Los días existentes quedan como PREVENCION.

-- CreateEnum
CREATE TYPE "AreaProgramacion" AS ENUM ('PREVENCION', 'TECNICA');

-- AlterTable
ALTER TABLE "ProgramacionPrevencion" ADD COLUMN "area" "AreaProgramacion" NOT NULL DEFAULT 'PREVENCION';

-- AlterTable: ventana de ejecución por formulario (solo TECNICA).
ALTER TABLE "FormularioProgramado" ADD COLUMN "fechaInicio" DATE,
ADD COLUMN "fechaTermino" DATE;

-- Unicidad viva por (obra, fecha, área): un día puede tener una programación de
-- Prevención y otra de Técnica.
DROP INDEX "ProgramacionPrevencion_obraId_fecha_key";
CREATE UNIQUE INDEX "ProgramacionPrevencion_obraId_fecha_area_key"
    ON "ProgramacionPrevencion" ("obraId", "fecha", "area") WHERE "eliminadoEn" IS NULL;

-- Coherencia de la ventana (término no anterior al inicio).
ALTER TABLE "FormularioProgramado" ADD CONSTRAINT "FormularioProgramado_ventana_check"
    CHECK ("fechaInicio" IS NULL OR "fechaTermino" IS NULL OR "fechaTermino" >= "fechaInicio");

-- Apoyo al calendario técnico (líneas cuyo inicio/término cae en el mes).
CREATE INDEX "FormularioProgramado_fechaInicio_idx" ON "FormularioProgramado" ("fechaInicio");
CREATE INDEX "FormularioProgramado_fechaTermino_idx" ON "FormularioProgramado" ("fechaTermino");
