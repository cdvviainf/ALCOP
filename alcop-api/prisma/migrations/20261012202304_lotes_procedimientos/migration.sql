-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_perfilId_fkey";

-- CreateTable
CREATE TABLE "TipoLote" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "actualizadoEn" TIMESTAMP(3),
    "actualizadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "TipoLote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedimiento" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL,
    "vigenciaHasta" TIMESTAMP(3),
    "archivoUrl" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "actualizadoEn" TIMESTAMP(3),
    "actualizadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "Procedimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoLoteProcedimiento" (
    "id" SERIAL NOT NULL,
    "tipoLoteId" INTEGER NOT NULL,
    "procedimientoId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,

    CONSTRAINT "TipoLoteProcedimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedimientoFormulario" (
    "id" SERIAL NOT NULL,
    "procedimientoId" INTEGER NOT NULL,
    "formularioId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,

    CONSTRAINT "ProcedimientoFormulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObraLote" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "tipoLoteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "actualizadoEn" TIMESTAMP(3),
    "actualizadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "ObraLote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoLote_codigo_key" ON "TipoLote"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Procedimiento_codigo_key" ON "Procedimiento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoLoteProcedimiento_tipoLoteId_procedimientoId_key" ON "TipoLoteProcedimiento"("tipoLoteId", "procedimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcedimientoFormulario_procedimientoId_formularioId_key" ON "ProcedimientoFormulario"("procedimientoId", "formularioId");

-- CreateIndex
CREATE UNIQUE INDEX "ObraLote_obraId_tipoLoteId_key" ON "ObraLote"("obraId", "tipoLoteId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoLoteProcedimiento" ADD CONSTRAINT "TipoLoteProcedimiento_tipoLoteId_fkey" FOREIGN KEY ("tipoLoteId") REFERENCES "TipoLote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoLoteProcedimiento" ADD CONSTRAINT "TipoLoteProcedimiento_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedimientoFormulario" ADD CONSTRAINT "ProcedimientoFormulario_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedimientoFormulario" ADD CONSTRAINT "ProcedimientoFormulario_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "Formulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObraLote" ADD CONSTRAINT "ObraLote_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObraLote" ADD CONSTRAINT "ObraLote_tipoLoteId_fkey" FOREIGN KEY ("tipoLoteId") REFERENCES "TipoLote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
