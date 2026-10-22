-- AlterTable
ALTER TABLE "HallazgoPrevencion" ADD COLUMN     "actualizadoEn" TIMESTAMP(3),
ADD COLUMN     "actualizadoPor" TEXT,
ADD COLUMN     "creadoPor" TEXT,
ADD COLUMN     "eliminadoPor" TEXT;
