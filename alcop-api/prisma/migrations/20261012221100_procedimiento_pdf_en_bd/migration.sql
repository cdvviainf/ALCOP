/*
  Warnings:

  - You are about to drop the column `archivoUrl` on the `Procedimiento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Procedimiento" DROP COLUMN "archivoUrl";

-- CreateTable
CREATE TABLE "ProcedimientoArchivo" (
    "id" SERIAL NOT NULL,
    "procedimientoId" INTEGER NOT NULL,
    "datos" BYTEA NOT NULL,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcedimientoArchivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcedimientoArchivo_procedimientoId_key" ON "ProcedimientoArchivo"("procedimientoId");

-- AddForeignKey
ALTER TABLE "ProcedimientoArchivo" ADD CONSTRAINT "ProcedimientoArchivo_procedimientoId_fkey" FOREIGN KEY ("procedimientoId") REFERENCES "Procedimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
