-- CreateEnum
CREATE TYPE "EstadoRespuesta" AS ENUM ('BORRADOR', 'CERRADO');

-- AlterTable
ALTER TABLE "RespuestaFormulario" ADD COLUMN     "actualizadoEn" TIMESTAMP(3),
ADD COLUMN     "actualizadoPor" TEXT,
ADD COLUMN     "creadoPor" TEXT,
ADD COLUMN     "estado" "EstadoRespuesta" NOT NULL DEFAULT 'BORRADOR',
ADD COLUMN     "fechaRevision" TIMESTAMP(3),
ADD COLUMN     "formularioProgramadoId" INTEGER;

-- Guarda de datos (QA-RP-002): el motor de llenado estaba diferido, así que
-- "fotoUrl" nunca se pobló (0 filas). Antes de dropear la columna, se aborta si
-- algún entorno tuviera fotos referenciadas allí: deben migrarse a
-- RespuestaPreguntaFotoData (binario en BD) antes de ejecutar esta migración.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "RespuestaPregunta" WHERE "fotoUrl" IS NOT NULL AND BTRIM("fotoUrl") <> '') THEN
    RAISE EXCEPTION 'Abortado: existen RespuestaPregunta.fotoUrl con datos. Migra esas fotos a RespuestaPreguntaFotoData antes de dropear la columna.';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "RespuestaPregunta" DROP COLUMN "fotoUrl";

-- CreateTable
CREATE TABLE "RespuestaPreguntaFoto" (
    "id" SERIAL NOT NULL,
    "respuestaPreguntaId" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "calidad" "CalidadImagen" NOT NULL,
    "tamano" INTEGER NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaPreguntaFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaPreguntaFotoData" (
    "id" SERIAL NOT NULL,
    "fotoId" INTEGER NOT NULL,
    "datos" BYTEA NOT NULL,

    CONSTRAINT "RespuestaPreguntaFotoData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RespuestaPreguntaFotoData_fotoId_key" ON "RespuestaPreguntaFotoData"("fotoId");

-- CreateIndex
CREATE UNIQUE INDEX "RespuestaFormulario_formularioProgramadoId_key" ON "RespuestaFormulario"("formularioProgramadoId");

-- CreateIndex
CREATE UNIQUE INDEX "RespuestaPregunta_respuestaFormularioId_preguntaId_key" ON "RespuestaPregunta"("respuestaFormularioId", "preguntaId");

-- AddForeignKey
ALTER TABLE "RespuestaFormulario" ADD CONSTRAINT "RespuestaFormulario_formularioProgramadoId_fkey" FOREIGN KEY ("formularioProgramadoId") REFERENCES "FormularioProgramado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaPreguntaFoto" ADD CONSTRAINT "RespuestaPreguntaFoto_respuestaPreguntaId_fkey" FOREIGN KEY ("respuestaPreguntaId") REFERENCES "RespuestaPregunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaPreguntaFotoData" ADD CONSTRAINT "RespuestaPreguntaFotoData_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "RespuestaPreguntaFoto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

