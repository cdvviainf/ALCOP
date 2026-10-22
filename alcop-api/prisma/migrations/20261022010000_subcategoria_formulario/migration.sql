-- CreateTable
CREATE TABLE "SubcategoriaFormulario" (
    "id" SERIAL NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoPor" TEXT,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "SubcategoriaFormulario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubcategoriaFormulario" ADD CONSTRAINT "SubcategoriaFormulario_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFormulario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
