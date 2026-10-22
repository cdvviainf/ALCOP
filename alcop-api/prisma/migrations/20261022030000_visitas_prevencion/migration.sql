-- CreateEnum
CREATE TYPE "PlazoUnidad" AS ENUM ('DIAS', 'HORAS');

-- CreateTable
CREATE TABLE "VisitaPrevencion" (
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

    CONSTRAINT "VisitaPrevencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallazgoPrevencion" (
    "id" SERIAL NOT NULL,
    "visitaId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "subcategoriaId" INTEGER NOT NULL,
    "nivelRiesgoId" INTEGER NOT NULL,
    "plazoValor" INTEGER NOT NULL,
    "plazoUnidad" "PlazoUnidad" NOT NULL,
    "comentario" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "HallazgoPrevencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallazgoPrevencionFoto" (
    "id" SERIAL NOT NULL,
    "hallazgoId" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "calidad" "CalidadImagen" NOT NULL,
    "tamano" INTEGER NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HallazgoPrevencionFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallazgoPrevencionFotoData" (
    "id" SERIAL NOT NULL,
    "fotoId" INTEGER NOT NULL,
    "datos" BYTEA NOT NULL,

    CONSTRAINT "HallazgoPrevencionFotoData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HallazgoPrevencionFotoData_fotoId_key" ON "HallazgoPrevencionFotoData"("fotoId");

-- AddForeignKey
ALTER TABLE "VisitaPrevencion" ADD CONSTRAINT "VisitaPrevencion_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaPrevencion" ADD CONSTRAINT "VisitaPrevencion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoPrevencion" ADD CONSTRAINT "HallazgoPrevencion_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "VisitaPrevencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoPrevencion" ADD CONSTRAINT "HallazgoPrevencion_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFormulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoPrevencion" ADD CONSTRAINT "HallazgoPrevencion_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "SubcategoriaFormulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoPrevencion" ADD CONSTRAINT "HallazgoPrevencion_nivelRiesgoId_fkey" FOREIGN KEY ("nivelRiesgoId") REFERENCES "NivelRiesgo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoPrevencionFoto" ADD CONSTRAINT "HallazgoPrevencionFoto_hallazgoId_fkey" FOREIGN KEY ("hallazgoId") REFERENCES "HallazgoPrevencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallazgoPrevencionFotoData" ADD CONSTRAINT "HallazgoPrevencionFotoData_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "HallazgoPrevencionFoto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
