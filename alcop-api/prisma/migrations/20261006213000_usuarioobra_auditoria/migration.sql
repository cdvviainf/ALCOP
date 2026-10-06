-- UsuarioObra: auditoría completa (actualizadoEn/actualizadoPor) — OBR-007.
ALTER TABLE "UsuarioObra" ADD COLUMN "actualizadoEn" TIMESTAMP(3);
ALTER TABLE "UsuarioObra" ADD COLUMN "actualizadoPor" TEXT;
