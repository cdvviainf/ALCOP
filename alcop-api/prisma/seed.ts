import { PrismaClient, NivelAcceso } from '@prisma/client'

const prisma = new PrismaClient()

/** Slug en MAYÚSCULAS para `codigo` (p.ej. "Seguridad General" -> "SEGURIDAD_GENERAL"). */
function slugCodigo(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

async function seedAreas() {
  // Area.codigo es @unique → upsert idempotente directo.
  const prevencion = await prisma.area.upsert({
    where: { codigo: 'PREVENCION' },
    update: { nombre: 'Prevención' },
    create: { codigo: 'PREVENCION', nombre: 'Prevención' },
  })
  const tecnica = await prisma.area.upsert({
    where: { codigo: 'TECNICA' },
    update: { nombre: 'Técnica' },
    create: { codigo: 'TECNICA', nombre: 'Técnica' },
  })
  return { prevencion, tecnica }
}

async function seedPerfiles() {
  // Perfil.nombre NO es @unique → find-or-create manual para idempotencia.
  // Orden de niveles: nivelPrevencion primero, nivelTecnica segundo
  // (Docs/usuarios-perfiles.md §6).
  const perfiles: Array<{ nombre: string; nivelPrevencion: NivelAcceso; nivelTecnica: NivelAcceso }> = [
    { nombre: 'Administrador', nivelPrevencion: NivelAcceso.TOTAL, nivelTecnica: NivelAcceso.TOTAL },
    { nombre: 'Jefe Prevencionista', nivelPrevencion: NivelAcceso.TOTAL, nivelTecnica: NivelAcceso.SIN_ACCESO },
    { nombre: 'Supervisor de obra', nivelPrevencion: NivelAcceso.TOTAL, nivelTecnica: NivelAcceso.TOTAL },
    { nombre: 'Prevencionista de obra', nivelPrevencion: NivelAcceso.TOTAL, nivelTecnica: NivelAcceso.SIN_ACCESO },
    { nombre: 'Jefe de terreno', nivelPrevencion: NivelAcceso.SIN_ACCESO, nivelTecnica: NivelAcceso.TOTAL },
    { nombre: 'Trabajador', nivelPrevencion: NivelAcceso.LECTURA, nivelTecnica: NivelAcceso.SIN_ACCESO },
  ]

  for (const p of perfiles) {
    const existente = await prisma.perfil.findFirst({ where: { nombre: p.nombre, eliminadoEn: null } })
    if (existente) {
      await prisma.perfil.update({
        where: { id: existente.id },
        data: { nivelPrevencion: p.nivelPrevencion, nivelTecnica: p.nivelTecnica },
      })
    } else {
      await prisma.perfil.create({ data: p })
    }
  }
}

async function seedCategorias(areaPrevencionId: number, areaTecnicaId: number) {
  // CategoriaFormulario.codigo NO es @unique → find-or-create por (areaId, codigo).
  // Mantenedor 100% dinámico (Docs/00-mantenedores-requeridos.md #2): esto es solo
  // el seed con las categorías conocidas hoy; el resto se crea desde la app.
  const prevencion = [
    'EPP',
    'Herramientas',
    'Seguridad General',
    'Instalaciones de Faena',
    'Emergencias',
    'Trabajos en Altura',
    'Bodegas',
    'Salud Ocupacional',
  ]
  const tecnica = ['LCH-AT-01AS', 'LCH-AT-02(F)', 'LCH-AT-05']

  const filas: Array<{ areaId: number; nombre: string }> = [
    ...prevencion.map((nombre) => ({ areaId: areaPrevencionId, nombre })),
    ...tecnica.map((nombre) => ({ areaId: areaTecnicaId, nombre })),
  ]

  for (const fila of filas) {
    const codigo = slugCodigo(fila.nombre)
    const existente = await prisma.categoriaFormulario.findFirst({
      where: { areaId: fila.areaId, codigo },
    })
    if (!existente) {
      await prisma.categoriaFormulario.create({
        data: { areaId: fila.areaId, codigo, nombre: fila.nombre },
      })
    }
  }
}

async function main() {
  const { prevencion, tecnica } = await seedAreas()
  await seedPerfiles()
  await seedCategorias(prevencion.id, tecnica.id)
  console.log('✅ Seed completado: 2 Areas, 6 Perfiles, categorías de formulario.')
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
