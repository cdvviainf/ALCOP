-- CreateTable
CREATE TABLE "NivelRiesgo" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "NivelRiesgo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NivelRiesgo_codigo_key" ON "NivelRiesgo"("codigo");
