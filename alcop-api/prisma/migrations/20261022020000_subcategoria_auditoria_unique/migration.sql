-- Auditoría completa (QA-OKA-003): actualizadoEn/actualizadoPor.
ALTER TABLE "SubcategoriaFormulario" ADD COLUMN     "actualizadoEn" TIMESTAMP(3),
ADD COLUMN     "actualizadoPor" TEXT;

-- Unicidad de codigo por categoría garantizada en BD (QA-OKA-002). Índice PARCIAL
-- (solo filas vivas) para no chocar con los soft-deletes que conservan el codigo.
CREATE UNIQUE INDEX "SubcategoriaFormulario_categoriaId_codigo_key"
  ON "SubcategoriaFormulario" ("categoriaId", "codigo")
  WHERE "eliminadoEn" IS NULL;
