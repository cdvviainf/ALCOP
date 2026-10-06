-- AlterTable
ALTER TABLE "CategoriaFormulario" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creadoPor" TEXT,
ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPor" TEXT;
