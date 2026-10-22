-- Separa ACCESO (UsuarioObra, sin rol) de TITULAR por rol (ObraTitular) — item 4.
-- Sin DELETE físico: se preserva el historial vía soft-delete (nucleo-compartido.md §6).

-- 1) Nueva tabla de titulares por rol.
CREATE TABLE "ObraTitular" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "rolObra" "RolObra" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "actualizadoEn" TIMESTAMP(3),
    "actualizadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,
    CONSTRAINT "ObraTitular_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ObraTitular" ADD CONSTRAINT "ObraTitular_obraId_fkey"
    FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ObraTitular" ADD CONSTRAINT "ObraTitular_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2) Backfill: TODO el historial de asignaciones (vivas y retiradas) se traslada
--    a ObraTitular conservando su auditoría y soft-delete (sin pérdida de datos).
INSERT INTO "ObraTitular" ("obraId", "rolObra", "usuarioId", "creadoEn", "creadoPor", "actualizadoEn", "actualizadoPor", "eliminadoEn", "eliminadoPor")
SELECT "obraId", "rolObra", "usuarioId", "creadoEn", "creadoPor", "actualizadoEn", "actualizadoPor", "eliminadoEn", "eliminadoPor"
FROM "UsuarioObra";

-- Si el modelo anterior tenía varios titulares VIVOS por (obra, rol), se conserva
-- el de menor id como vigente y el resto queda soft-deleted (política explícita).
UPDATE "ObraTitular" t
SET "eliminadoEn" = CURRENT_TIMESTAMP, "eliminadoPor" = 'migracion:acceso_titular'
WHERE t."eliminadoEn" IS NULL
  AND EXISTS (
    SELECT 1 FROM "ObraTitular" o
    WHERE o."obraId" = t."obraId" AND o."rolObra" = t."rolObra"
      AND o."eliminadoEn" IS NULL AND o."id" < t."id"
  );

CREATE UNIQUE INDEX "ObraTitular_obraId_rolObra_key"
    ON "ObraTitular" ("obraId", "rolObra") WHERE "eliminadoEn" IS NULL;

-- 3) Colapsar UsuarioObra a acceso puro (una fila VIVA por obra+usuario, sin rol).
--    Se conserva la de menor id viva; las demás vivas quedan soft-deleted (no se
--    borran físicamente). Las ya retiradas se mantienen como historial.
UPDATE "UsuarioObra" a
SET "eliminadoEn" = CURRENT_TIMESTAMP, "eliminadoPor" = 'migracion:acceso_titular'
WHERE a."eliminadoEn" IS NULL
  AND EXISTS (
    SELECT 1 FROM "UsuarioObra" b
    WHERE b."obraId" = a."obraId" AND b."usuarioId" = a."usuarioId"
      AND b."eliminadoEn" IS NULL AND b."id" < a."id"
  );

ALTER TABLE "UsuarioObra" DROP CONSTRAINT IF EXISTS "UsuarioObra_obraId_rolObra_usuarioId_key";
ALTER TABLE "UsuarioObra" DROP COLUMN "rolObra";

-- Acceso único por (obra, usuario) entre los vivos (índice único parcial).
CREATE UNIQUE INDEX "UsuarioObra_obraId_usuarioId_key"
    ON "UsuarioObra" ("obraId", "usuarioId") WHERE "eliminadoEn" IS NULL;
