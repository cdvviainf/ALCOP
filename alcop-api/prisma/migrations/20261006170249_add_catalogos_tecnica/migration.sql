-- CreateTable
CREATE TABLE "TipoHallazgoTecnico" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "TipoHallazgoTecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaConstructiva" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "EtapaConstructiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaNido" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "EtapaNido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoHallazgoTecnico_codigo_key" ON "TipoHallazgoTecnico"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "EtapaConstructiva_codigo_key" ON "EtapaConstructiva"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "EtapaNido_codigo_key" ON "EtapaNido"("codigo");
