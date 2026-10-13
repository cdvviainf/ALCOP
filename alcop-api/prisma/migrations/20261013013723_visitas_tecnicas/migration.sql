-- CreateEnum
CREATE TYPE "EstadoVisita" AS ENUM ('EN_CURSO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "CalidadImagen" AS ENUM ('ORIGINAL', 'OPTIMIZADA', 'MEDIA', 'BAJA');

-- CreateTable
CREATE TABLE "LoteUnidad" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "tipoLoteId" INTEGER NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "LoteUnidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitaTecnica" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT,
    "horaTermino" TEXT,
    "estado" "EstadoVisita" NOT NULL DEFAULT 'EN_CURSO',
    "resumenFinal" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "actualizadoEn" TIMESTAMP(3),
    "actualizadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "VisitaTecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallazgoTecnico" (
    "id" SERIAL NOT NULL,
    "visitaId" INTEGER NOT NULL,
    "loteUnidadId" INTEGER NOT NULL,
    "tipoHallazgoId" INTEGER NOT NULL,
    "comentario" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "HallazgoTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallazgoFoto" (
    "id" SERIAL NOT NULL,
    "hallazgoId" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "calidad" "CalidadImagen" NOT NULL,
    "tamano" INTEGER NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HallazgoFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallazgoFotoData" (
    "id" SERIAL NOT NULL,
    "fotoId" INTEGER NOT NULL,
    "datos" BYTEA NOT NULL,

    CONSTRAINT "HallazgoFotoData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoteUnidad_obraId_tipoLoteId_correlativo_key" ON "LoteUnidad"("obraId", "tipoLoteId", "correlativo");

-- CreateIndex
CREATE UNIQUE INDEX "HallazgoFotoData_fotoId_key" ON "HallazgoFotoData"("fotoId");

-- CreateIndex
CREATE UNIQUE INDEX "Configuracion_clave_key" ON "Configuracion"("clave");

-- AddForeignKey
ALTER TABLE "LoteUnidad" ADD CONSTRAINT "LoteUnidad_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteUnidad" ADD CONSTRAINT "LoteUnidad_tipoLoteId_fkey" FOREIGN KEY ("tipoLoteId") REFERENCES "TipoLote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaTecnica" ADD CONSTRAINT "VisitaTecnica_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaTecnica" ADD CONSTRAINT "VisitaTecnica_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoTecnico" ADD CONSTRAINT "HallazgoTecnico_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "VisitaTecnica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoTecnico" ADD CONSTRAINT "HallazgoTecnico_loteUnidadId_fkey" FOREIGN KEY ("loteUnidadId") REFERENCES "LoteUnidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoTecnico" ADD CONSTRAINT "HallazgoTecnico_tipoHallazgoId_fkey" FOREIGN KEY ("tipoHallazgoId") REFERENCES "TipoHallazgoTecnico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoFoto" ADD CONSTRAINT "HallazgoFoto_hallazgoId_fkey" FOREIGN KEY ("hallazgoId") REFERENCES "HallazgoTecnico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoFotoData" ADD CONSTRAINT "HallazgoFotoData_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "HallazgoFoto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
