-- Modelo de accesos granular (Docs/usuarios-perfiles.md v2). Reemplaza
-- Perfil.nivelPrevencion/nivelTecnica por Funcion + PerfilPermiso + toggles de
-- área, y agrega Usuario.esAdmin. Migración con seed de funciones y backfill.

-- ─── Enums y tablas nuevas ───────────────────────────────────────────────────
CREATE TYPE "FuncionArea" AS ENUM ('TRANSVERSAL', 'PREVENCION', 'TECNICA');

CREATE TABLE "Funcion" (
  "id" SERIAL NOT NULL,
  "codigo" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "area" "FuncionArea" NOT NULL,
  "orden" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Funcion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Funcion_codigo_key" ON "Funcion"("codigo");

CREATE TABLE "PerfilPermiso" (
  "id" SERIAL NOT NULL,
  "perfilId" INTEGER NOT NULL,
  "funcionId" INTEGER NOT NULL,
  "nivel" "NivelAcceso" NOT NULL DEFAULT 'SIN_ACCESO',
  CONSTRAINT "PerfilPermiso_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PerfilPermiso_perfilId_funcionId_key" ON "PerfilPermiso"("perfilId", "funcionId");
ALTER TABLE "PerfilPermiso" ADD CONSTRAINT "PerfilPermiso_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PerfilPermiso" ADD CONSTRAINT "PerfilPermiso_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Seed de funciones ───────────────────────────────────────────────────────
INSERT INTO "Funcion" ("codigo", "nombre", "area", "orden") VALUES
  ('OBRAS', 'Obras', 'TRANSVERSAL', 1),
  ('PREV_INSPECCION', 'Inspección Prevención', 'PREVENCION', 1),
  ('PREV_FORMULARIOS', 'Formularios', 'PREVENCION', 2),
  ('PREV_ANALISIS_IA', 'Análisis IA', 'PREVENCION', 3),
  ('PREV_REPORTES', 'Reportes', 'PREVENCION', 4),
  ('PREV_CAT_CATEGORIAS', 'Categorías', 'PREVENCION', 5),
  ('PREV_CAT_NIVEL_RIESGO', 'Nivel de Riesgo', 'PREVENCION', 6),
  ('TEC_INSPECCION', 'Inspección Técnica', 'TECNICA', 1),
  ('TEC_FORMULARIOS', 'Formularios', 'TECNICA', 2),
  ('TEC_ANALISIS_IA', 'Análisis IA', 'TECNICA', 3),
  ('TEC_REPORTES', 'Reportes', 'TECNICA', 4),
  ('TEC_CAT_CATEGORIAS', 'Categorías', 'TECNICA', 5),
  ('TEC_CAT_TIPOS_HALLAZGO', 'Tipos de Hallazgo', 'TECNICA', 6),
  ('TEC_CAT_ETAPAS_CONSTRUCTIVAS', 'Etapas Constructivas', 'TECNICA', 7),
  ('TEC_CAT_ETAPAS_NIDO', 'Etapas de Nido', 'TECNICA', 8);

-- ─── Perfil: toggles de área ─────────────────────────────────────────────────
ALTER TABLE "Perfil" ADD COLUMN "areaPrevencion" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Perfil" ADD COLUMN "areaTecnica" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Perfil" SET
  "areaPrevencion" = ("nivelPrevencion" <> 'SIN_ACCESO'),
  "areaTecnica" = ("nivelTecnica" <> 'SIN_ACCESO');

-- ─── Backfill de permisos desde los niveles viejos ───────────────────────────
INSERT INTO "PerfilPermiso" ("perfilId", "funcionId", "nivel")
SELECT p."id", f."id", p."nivelPrevencion"
FROM "Perfil" p CROSS JOIN "Funcion" f WHERE f."area" = 'PREVENCION';

INSERT INTO "PerfilPermiso" ("perfilId", "funcionId", "nivel")
SELECT p."id", f."id", p."nivelTecnica"
FROM "Perfil" p CROSS JOIN "Funcion" f WHERE f."area" = 'TECNICA';

-- Obras (transversal): el mayor de ambos niveles
INSERT INTO "PerfilPermiso" ("perfilId", "funcionId", "nivel")
SELECT p."id", f."id",
  CASE
    WHEN p."nivelPrevencion" = 'TOTAL' OR p."nivelTecnica" = 'TOTAL' THEN 'TOTAL'::"NivelAcceso"
    WHEN p."nivelPrevencion" = 'LECTURA' OR p."nivelTecnica" = 'LECTURA' THEN 'LECTURA'::"NivelAcceso"
    ELSE 'SIN_ACCESO'::"NivelAcceso"
  END
FROM "Perfil" p CROSS JOIN "Funcion" f WHERE f."area" = 'TRANSVERSAL';

-- ─── Usuario: esAdmin + perfilId nullable ────────────────────────────────────
-- esAdmin NO se infiere de datos (los niveles TOTAL/TOTAL NO implican admin: p.ej.
-- "Supervisor de obra" es operativo, no admin transversal — PG-004). Queda en
-- false para todos; al administrador conocido lo promueve el seed por SEED_ADMIN_EMAIL.
ALTER TABLE "Usuario" ADD COLUMN "esAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Usuario" ALTER COLUMN "perfilId" DROP NOT NULL;

-- ─── Quitar niveles viejos de Perfil ─────────────────────────────────────────
ALTER TABLE "Perfil" DROP COLUMN "nivelPrevencion";
ALTER TABLE "Perfil" DROP COLUMN "nivelTecnica";
