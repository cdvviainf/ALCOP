-- CreateEnum
CREATE TYPE "TipoRegistroHallazgo" AS ENUM ('HALLAZGO', 'NOTA_TECNICA');

-- DropForeignKey
ALTER TABLE "HallazgoTecnico" DROP CONSTRAINT "HallazgoTecnico_tipoHallazgoId_fkey";

-- AlterTable
ALTER TABLE "HallazgoTecnico" ADD COLUMN     "tipoRegistro" "TipoRegistroHallazgo" NOT NULL DEFAULT 'HALLAZGO',
ALTER COLUMN "tipoHallazgoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "HallazgoTecnico" ADD CONSTRAINT "HallazgoTecnico_tipoHallazgoId_fkey" FOREIGN KEY ("tipoHallazgoId") REFERENCES "TipoHallazgoTecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
