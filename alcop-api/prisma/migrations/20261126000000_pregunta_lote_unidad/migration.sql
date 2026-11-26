-- Tipo de pregunta "Unidad (Lote)": la respuesta referencia una LoteUnidad de la obra.
ALTER TYPE "TipoRespuesta" ADD VALUE 'LOTE_UNIDAD';

ALTER TABLE "RespuestaPregunta" ADD COLUMN "valorLoteUnidadId" INTEGER;

CREATE INDEX "RespuestaPregunta_valorLoteUnidadId_idx" ON "RespuestaPregunta"("valorLoteUnidadId");

ALTER TABLE "RespuestaPregunta" ADD CONSTRAINT "RespuestaPregunta_valorLoteUnidadId_fkey" FOREIGN KEY ("valorLoteUnidadId") REFERENCES "LoteUnidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
