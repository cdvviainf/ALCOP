import 'dotenv/config' // carga .env para DATABASE_URL / BETTER_AUTH_* al correr standalone
import { NivelAcceso } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { auth } from '../lib/auth.js'

// Credenciales demo del administrador sembrado (idempotente).
const ADMIN_EMAIL = 'admin@alcop.cl'
const ADMIN_PASSWORD = 'Alcop.Demo2026'
const ADMIN_NOMBRE = 'Administrador ALCOP'

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
  // Niveles exactos de Docs/usuarios-perfiles.md §6 (Prevención, luego Técnica).
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

async function seedObras() {
  // Match del mockup "Tus obras". Idempotente por nombre (Obra.nombre no es @unique).
  const obras: Array<{ nombre: string; comuna: string | null }> = [
    { nombre: 'Condominio Mirador Piedra Roja', comuna: 'Chicureo' },
    { nombre: 'Condominio Chamisero III', comuna: null },
    { nombre: 'Condominio Casas Olmo', comuna: null },
    { nombre: 'Condominio Mirador del Alto', comuna: 'San Esteban' },
  ]
  for (const o of obras) {
    const existente = await prisma.obra.findFirst({ where: { nombre: o.nombre, eliminadoEn: null } })
    if (!existente) {
      await prisma.obra.create({
        data: { nombre: o.nombre, comuna: o.comuna, creadoPor: 'seed' },
      })
    } else if (existente.comuna !== o.comuna) {
      await prisma.obra.update({ where: { id: existente.id }, data: { comuna: o.comuna } })
    }
  }
}

async function seedAdmin() {
  // Perfil Administrador (ya sembrado por seedPerfiles).
  const perfil = await prisma.perfil.findFirst({ where: { nombre: 'Administrador', eliminadoEn: null } })
  if (!perfil) throw new Error('No existe el perfil "Administrador". Revisa seedPerfiles.')

  // Idempotencia: si el Usuario de dominio ya existe, no duplicar.
  const usuarioExistente = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } })
  if (usuarioExistente?.authUserId) {
    console.log(`ℹ️  Usuario admin ya existe (${ADMIN_EMAIL}). Nada que hacer.`)
    return
  }

  // Crear la identidad en Better Auth si no existe (hashea la credencial y crea
  // auth_user + auth_account). El hook session.create bloquea la auto-sesión
  // porque aún no hay Usuario de dominio enlazado — es esperado; igual se crean
  // auth_user/auth_account, que es lo que necesitamos.
  let authUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (!authUser) {
    try {
      await auth.api.signUpEmail({
        body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NOMBRE },
      })
    } catch (err) {
      // El bloqueo de la auto-sesión (hook) puede propagarse como error aun
      // habiendo creado auth_user/auth_account. Se reintenta la búsqueda abajo.
      console.warn('⚠️  signUpEmail lanzó (posible bloqueo de auto-sesión, esperado):', (err as Error).message)
    }
    authUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
    if (!authUser) throw new Error('No se pudo crear la identidad Better Auth del admin.')
  }

  // Crear/enlazar el Usuario de dominio.
  if (usuarioExistente) {
    await prisma.usuario.update({
      where: { id: usuarioExistente.id },
      data: { authUserId: authUser.id, perfilId: perfil.id, activo: true },
    })
  } else {
    await prisma.usuario.create({
      data: {
        nombre: ADMIN_NOMBRE,
        email: ADMIN_EMAIL,
        perfilId: perfil.id,
        authUserId: authUser.id,
        activo: true,
        creadoPor: 'seed',
      },
    })
  }
}

async function main() {
  const { prevencion, tecnica } = await seedAreas()
  await seedPerfiles()
  await seedCategorias(prevencion.id, tecnica.id)
  await seedObras()
  await seedAdmin()
  console.log('✅ Seed completado: 2 Areas, 6 Perfiles, 11 Categorías, 4 Obras, 1 Admin.')
  console.log('🔑 Credenciales demo admin:')
  console.log(`   email:    ${ADMIN_EMAIL}`)
  console.log(`   password: ${ADMIN_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
