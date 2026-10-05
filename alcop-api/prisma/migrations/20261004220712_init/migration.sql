-- CreateEnum
CREATE TYPE "NivelAcceso" AS ENUM ('SIN_ACCESO', 'LECTURA', 'TOTAL');

-- CreateEnum
CREATE TYPE "RolObra" AS ENUM ('ADMINISTRADOR', 'JEFE_DE_TERRENO', 'PREVENCIONISTA');

-- CreateEnum
CREATE TYPE "TipoRespuesta" AS ENUM ('CHECKBOX', 'SELECCION_MULTIPLE', 'NUMERO', 'TEXTO', 'TEXTO_LARGO');

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "perfilId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivelPrevencion" "NivelAcceso" NOT NULL DEFAULT 'SIN_ACCESO',
    "nivelTecnica" "NivelAcceso" NOT NULL DEFAULT 'SIN_ACCESO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioObra" (
    "id" SERIAL NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "obraId" INTEGER NOT NULL,
    "rolObra" "RolObra" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioObra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obra" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaFormulario" (
    "id" SERIAL NOT NULL,
    "areaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "CategoriaFormulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formulario" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "requiereObra" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT NOT NULL,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "Formulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pregunta" (
    "id" SERIAL NOT NULL,
    "formularioId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "tipoRespuesta" "TipoRespuesta" NOT NULL,
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "permiteFoto" BOOLEAN NOT NULL DEFAULT false,
    "opciones" TEXT[],

    CONSTRAINT "Pregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaFormulario" (
    "id" SERIAL NOT NULL,
    "formularioId" INTEGER NOT NULL,
    "obraId" INTEGER NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaFormulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaPregunta" (
    "id" SERIAL NOT NULL,
    "respuestaFormularioId" INTEGER NOT NULL,
    "preguntaId" INTEGER NOT NULL,
    "valorTexto" TEXT,
    "valorNumero" DECIMAL(65,30),
    "valorCheckbox" TEXT,
    "valorSeleccionMultiple" TEXT[],
    "fotoUrl" TEXT,

    CONSTRAINT "RespuestaPregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormularioPermiso" (
    "id" SERIAL NOT NULL,
    "formularioId" INTEGER NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "puedeVer" BOOLEAN NOT NULL DEFAULT true,
    "puedeEditar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FormularioPermiso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Area_codigo_key" ON "Area"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioObra_obraId_rolObra_key" ON "UsuarioObra"("obraId", "rolObra");

-- CreateIndex
CREATE UNIQUE INDEX "Formulario_codigo_key" ON "Formulario"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "FormularioPermiso_formularioId_usuarioId_key" ON "FormularioPermiso"("formularioId", "usuarioId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioObra" ADD CONSTRAINT "UsuarioObra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioObra" ADD CONSTRAINT "UsuarioObra_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaFormulario" ADD CONSTRAINT "CategoriaFormulario_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulario" ADD CONSTRAINT "Formulario_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formulario" ADD CONSTRAINT "Formulario_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFormulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "Formulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaFormulario" ADD CONSTRAINT "RespuestaFormulario_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "Formulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaFormulario" ADD CONSTRAINT "RespuestaFormulario_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaFormulario" ADD CONSTRAINT "RespuestaFormulario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaPregunta" ADD CONSTRAINT "RespuestaPregunta_respuestaFormularioId_fkey" FOREIGN KEY ("respuestaFormularioId") REFERENCES "RespuestaFormulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaPregunta" ADD CONSTRAINT "RespuestaPregunta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "Pregunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioPermiso" ADD CONSTRAINT "FormularioPermiso_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "Formulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioPermiso" ADD CONSTRAINT "FormularioPermiso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
