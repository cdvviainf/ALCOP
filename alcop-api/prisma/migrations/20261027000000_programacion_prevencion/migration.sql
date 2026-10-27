-- CreateTable
CREATE TABLE "ProgramacionPrevencion" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "comentario" TEXT,
    "usuarioId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "actualizadoEn" TIMESTAMP(3),
    "actualizadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "ProgramacionPrevencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormularioProgramado" (
    "id" SERIAL NOT NULL,
    "programacionId" INTEGER NOT NULL,
    "formularioId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "FormularioProgramado_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProgramacionPrevencion" ADD CONSTRAINT "ProgramacionPrevencion_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramacionPrevencion" ADD CONSTRAINT "ProgramacionPrevencion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioProgramado" ADD CONSTRAINT "FormularioProgramado_programacionId_fkey" FOREIGN KEY ("programacionId") REFERENCES "ProgramacionPrevencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioProgramado" ADD CONSTRAINT "FormularioProgramado_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "Formulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Índices únicos PARCIALES (soft-delete aware): un agendamiento vivo por (obra, fecha)
-- y un formulario vivo por agendamiento. Ver nota en schema.prisma.
CREATE UNIQUE INDEX "ProgramacionPrevencion_obraId_fecha_key"
    ON "ProgramacionPrevencion" ("obraId", "fecha") WHERE "eliminadoEn" IS NULL;

CREATE UNIQUE INDEX "FormularioProgramado_programacionId_formularioId_key"
    ON "FormularioProgramado" ("programacionId", "formularioId") WHERE "eliminadoEn" IS NULL;

-- Índices de apoyo para los listados del calendario (por obra+fecha) y por formulario.
CREATE INDEX "ProgramacionPrevencion_obraId_idx" ON "ProgramacionPrevencion" ("obraId");
CREATE INDEX "FormularioProgramado_programacionId_idx" ON "FormularioProgramado" ("programacionId");
