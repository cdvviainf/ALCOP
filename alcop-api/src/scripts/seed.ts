import 'dotenv/config' // carga .env para DATABASE_URL / BETTER_AUTH_* al correr standalone
import { FuncionArea, NivelAcceso } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { auth } from '../lib/auth.js'
import { env } from '../config/env.js'
import { slugCodigo } from '../shared/slug.js'

// El administrador se siembra con credenciales desde el entorno (SEED_ADMIN_*).
// NO hay password por defecto en el repo: si SEED_ADMIN_PASSWORD no está
// definido, seedAdmin() se omite (evita credenciales conocidas comprometidas).
const ADMIN_EMAIL = env.SEED_ADMIN_EMAIL
const ADMIN_PASSWORD = env.SEED_ADMIN_PASSWORD
const ADMIN_NOMBRE = 'Administrador ALCOP'

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

const FUNCIONES: Array<{ codigo: string; nombre: string; area: FuncionArea; orden: number }> = [
  { codigo: 'OBRAS', nombre: 'Obras', area: FuncionArea.TRANSVERSAL, orden: 1 },
  { codigo: 'PREV_INSPECCION', nombre: 'Inspección Prevención', area: FuncionArea.PREVENCION, orden: 1 },
  { codigo: 'PREV_FORMULARIOS', nombre: 'Formularios', area: FuncionArea.PREVENCION, orden: 2 },
  { codigo: 'PREV_ANALISIS_IA', nombre: 'Análisis IA', area: FuncionArea.PREVENCION, orden: 3 },
  { codigo: 'PREV_REPORTES', nombre: 'Reportes', area: FuncionArea.PREVENCION, orden: 4 },
  { codigo: 'PREV_CAT_CATEGORIAS', nombre: 'Categorías', area: FuncionArea.PREVENCION, orden: 5 },
  { codigo: 'PREV_CAT_NIVEL_RIESGO', nombre: 'Nivel de Riesgo', area: FuncionArea.PREVENCION, orden: 6 },
  { codigo: 'TEC_INSPECCION', nombre: 'Inspección Técnica', area: FuncionArea.TECNICA, orden: 1 },
  { codigo: 'TEC_FORMULARIOS', nombre: 'Formularios', area: FuncionArea.TECNICA, orden: 2 },
  { codigo: 'TEC_ANALISIS_IA', nombre: 'Análisis IA', area: FuncionArea.TECNICA, orden: 3 },
  { codigo: 'TEC_REPORTES', nombre: 'Reportes', area: FuncionArea.TECNICA, orden: 4 },
  { codigo: 'TEC_CAT_CATEGORIAS', nombre: 'Categorías', area: FuncionArea.TECNICA, orden: 5 },
  { codigo: 'TEC_CAT_TIPOS_HALLAZGO', nombre: 'Tipos de Hallazgo', area: FuncionArea.TECNICA, orden: 6 },
  { codigo: 'TEC_CAT_ETAPAS_CONSTRUCTIVAS', nombre: 'Etapas Constructivas', area: FuncionArea.TECNICA, orden: 7 },
  { codigo: 'TEC_CAT_ETAPAS_NIDO', nombre: 'Etapas de Nido', area: FuncionArea.TECNICA, orden: 8 },
]

async function seedFunciones() {
  for (const f of FUNCIONES) {
    await prisma.funcion.upsert({
      where: { codigo: f.codigo },
      update: { nombre: f.nombre, area: f.area, orden: f.orden },
      create: f,
    })
  }
}

/** Mayor de dos niveles (SIN_ACCESO < LECTURA < TOTAL). */
function mayorNivel(a: NivelAcceso, b: NivelAcceso): NivelAcceso {
  if (a === NivelAcceso.TOTAL || b === NivelAcceso.TOTAL) return NivelAcceso.TOTAL
  if (a === NivelAcceso.LECTURA || b === NivelAcceso.LECTURA) return NivelAcceso.LECTURA
  return NivelAcceso.SIN_ACCESO
}

async function seedPerfiles() {
  // Modelo granular (v2): cada perfil se mapea desde un nivel por área al nuevo
  // esquema (área on/off + un permiso por función). Idempotente por nombre.
  const S = NivelAcceso.SIN_ACCESO
  const L = NivelAcceso.LECTURA
  const T = NivelAcceso.TOTAL
  const perfiles: Array<{ nombre: string; prev: NivelAcceso; tec: NivelAcceso }> = [
    { nombre: 'Administrador', prev: T, tec: T },
    { nombre: 'Jefe Prevencionista', prev: T, tec: S },
    { nombre: 'Supervisor de obra', prev: T, tec: T },
    { nombre: 'Prevencionista de obra', prev: T, tec: S },
    { nombre: 'Jefe de terreno', prev: S, tec: T },
    { nombre: 'Trabajador', prev: L, tec: S },
  ]

  const funciones = await prisma.funcion.findMany({ select: { id: true, area: true } })

  for (const p of perfiles) {
    const obras = mayorNivel(p.prev, p.tec)
    const nivelPara = (area: FuncionArea): NivelAcceso =>
      area === FuncionArea.PREVENCION ? p.prev : area === FuncionArea.TECNICA ? p.tec : obras

    const existente = await prisma.perfil.findFirst({ where: { nombre: p.nombre, eliminadoEn: null } })
    if (!existente) {
      // Alta: inicializa toggles + la matriz completa de permisos del seed.
      await prisma.perfil.create({
        data: {
          nombre: p.nombre,
          areaPrevencion: p.prev !== S,
          areaTecnica: p.tec !== S,
          permisos: { create: funciones.map((f) => ({ funcionId: f.id, nivel: nivelPara(f.area) })) },
        },
      })
    } else {
      // Existente: NO se sobreescribe lo administrado desde la app (toggles ni
      // niveles). Solo se agregan funciones nuevas que falten, en SIN_ACCESO (PG-005).
      const yaTiene = new Set(
        (await prisma.perfilPermiso.findMany({ where: { perfilId: existente.id }, select: { funcionId: true } })).map(
          (x) => x.funcionId
        )
      )
      const faltantes = funciones.filter((f) => !yaTiene.has(f.id))
      if (faltantes.length > 0) {
        await prisma.perfilPermiso.createMany({
          data: faltantes.map((f) => ({ perfilId: existente.id, funcionId: f.id, nivel: NivelAcceso.SIN_ACCESO })),
        })
      }
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
  // Match del mockup "Tus obras". Idempotente por codigo (@unique).
  const obras: Array<{ codigo: string; nombre: string; comuna: string | null }> = [
    { codigo: 'MPR', nombre: 'Condominio Mirador Piedra Roja', comuna: 'Chicureo' },
    { codigo: 'CH3', nombre: 'Condominio Chamisero III', comuna: null },
    { codigo: 'OLM', nombre: 'Condominio Casas Olmo', comuna: null },
    { codigo: 'MDA', nombre: 'Condominio Mirador del Alto', comuna: 'San Esteban' },
  ]
  for (const o of obras) {
    // Reconcilia por nombre (las filas backfilleadas de la migración tienen
    // codigo 'OBRA-<id>'); así el seed les fija el código definitivo sin duplicar.
    const existente = await prisma.obra.findFirst({ where: { nombre: o.nombre, eliminadoEn: null } })
    if (existente) {
      await prisma.obra.update({
        where: { id: existente.id },
        data: { codigo: o.codigo, comuna: o.comuna },
      })
    } else {
      await prisma.obra.create({
        data: { codigo: o.codigo, nombre: o.nombre, comuna: o.comuna, estado: 'EN_EJECUCION', creadoPor: 'seed' },
      })
    }
  }
}

async function seedNivelesRiesgo() {
  // NivelRiesgo.codigo es @unique → upsert idempotente. Catálogo administrable
  // (Docs/plan-mantenedores.md §2): esto es el punto de partida; el resto se
  // crea/edita desde la app.
  const niveles = [
    { nombre: 'Alto', orden: 1 },
    { nombre: 'Medio', orden: 2 },
    { nombre: 'Observación', orden: 3 },
    { nombre: 'No conformidad', orden: 4 },
  ]
  for (const n of niveles) {
    const codigo = slugCodigo(n.nombre)
    await prisma.nivelRiesgo.upsert({
      where: { codigo },
      update: { nombre: n.nombre, orden: n.orden },
      create: { codigo, nombre: n.nombre, orden: n.orden, creadoPor: 'seed' },
    })
  }
}

async function seedTiposHallazgo() {
  // TipoHallazgoTecnico.codigo @unique → upsert idempotente. Punto de partida.
  const tipos = [
    { nombre: 'No conformidad', orden: 1 },
    { nombre: 'Mejora', orden: 2 },
    { nombre: 'Sugerencia', orden: 3 },
  ]
  for (const t of tipos) {
    const codigo = slugCodigo(t.nombre)
    await prisma.tipoHallazgoTecnico.upsert({
      where: { codigo },
      update: { nombre: t.nombre, orden: t.orden },
      create: { codigo, nombre: t.nombre, orden: t.orden, creadoPor: 'seed' },
    })
  }
}

async function seedEtapasConstructivas() {
  // EtapaConstructiva.codigo @unique → upsert idempotente. Punto de partida.
  const etapas = [
    { nombre: 'Obra gruesa', orden: 1 },
    { nombre: 'Faenas húmedas', orden: 2 },
    { nombre: 'Terminaciones', orden: 3 },
    { nombre: 'Especialidades', orden: 4 },
    { nombre: 'Urbanización', orden: 5 },
  ]
  for (const e of etapas) {
    const codigo = slugCodigo(e.nombre)
    await prisma.etapaConstructiva.upsert({
      where: { codigo },
      update: { nombre: e.nombre, orden: e.orden },
      create: { codigo, nombre: e.nombre, orden: e.orden, creadoPor: 'seed' },
    })
  }
}

async function seedEtapasNido() {
  // Las 6 etapas del hito "nido", en orden (alcop-esquema.html / CLAUDE.md §7).
  const etapas = [
    { nombre: 'Descubierto', orden: 1 },
    { nombre: 'Picado', orden: 2 },
    { nombre: 'Buzón', orden: 3 },
    { nombre: 'Llenado', orden: 4 },
    { nombre: 'Descimbre', orden: 5 },
    { nombre: 'Perfilado', orden: 6 },
  ]
  for (const e of etapas) {
    const codigo = slugCodigo(e.nombre)
    await prisma.etapaNido.upsert({
      where: { codigo },
      update: { nombre: e.nombre, orden: e.orden },
      create: { codigo, nombre: e.nombre, orden: e.orden, creadoPor: 'seed' },
    })
  }
}

async function seedAdmin() {
  if (!ADMIN_PASSWORD) {
    console.warn('⚠️  SEED_ADMIN_PASSWORD no definido — se omite la creación/rotación del admin.')
    return
  }

  // Perfil Administrador (ya sembrado por seedPerfiles).
  const perfil = await prisma.perfil.findFirst({ where: { nombre: 'Administrador', eliminadoEn: null } })
  if (!perfil) throw new Error('No existe el perfil "Administrador". Revisa seedPerfiles.')

  // 1) Identidad Better Auth (auth_user + auth_account credential).
  let authUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (!authUser) {
    try {
      // signUpEmail hashea la credencial y crea auth_user + auth_account. El hook
      // session.create bloquea la auto-sesión (aún no hay Usuario de dominio); es
      // esperado y no impide la creación de la identidad.
      await auth.api.signUpEmail({
        body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NOMBRE },
      })
    } catch (err) {
      console.warn('⚠️  signUpEmail lanzó (posible bloqueo de auto-sesión, esperado):', (err as Error).message)
    }
    authUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
    if (!authUser) throw new Error('No se pudo crear la identidad Better Auth del admin.')
  } else {
    // 2) Rotación idempotente: fija la credencial a SEED_ADMIN_PASSWORD actual,
    //    de modo que cambiar la variable y redesplegar rote la contraseña del
    //    admin sin tocar la BD a mano.
    const ctx = await auth.$context
    const hash = await ctx.password.hash(ADMIN_PASSWORD)
    await prisma.account.updateMany({
      where: { userId: authUser.id, providerId: 'credential' },
      data: { password: hash },
    })
  }

  // 3) Crear/enlazar el Usuario de dominio.
  const usuarioExistente = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } })
  if (usuarioExistente) {
    await prisma.usuario.update({
      where: { id: usuarioExistente.id },
      data: { authUserId: authUser.id, perfilId: perfil.id, activo: true, esAdmin: true },
    })
  } else {
    await prisma.usuario.create({
      data: {
        nombre: ADMIN_NOMBRE,
        email: ADMIN_EMAIL,
        perfilId: perfil.id,
        esAdmin: true,
        authUserId: authUser.id,
        activo: true,
        creadoPor: 'seed',
      },
    })
  }
  console.log(`🔑 Admin listo: ${ADMIN_EMAIL} (contraseña desde SEED_ADMIN_PASSWORD).`)
}

async function main() {
  const { prevencion, tecnica } = await seedAreas()
  await seedFunciones()
  await seedPerfiles()
  await seedCategorias(prevencion.id, tecnica.id)
  await seedNivelesRiesgo()
  await seedTiposHallazgo()
  await seedEtapasConstructivas()
  await seedEtapasNido()
  await seedObras()
  // El seed del admin es best-effort: un fallo acá NO debe abortar el arranque
  // del contenedor (el CMD encadena `seed && server`).
  try {
    await seedAdmin()
  } catch (err) {
    console.warn('⚠️  Seed de admin falló (no bloquea el arranque):', (err as Error).message)
  }
  console.log(
    '✅ Seed completado: 2 Areas, 15 Funciones, 6 Perfiles, 11 Categorías, 4 Niveles de riesgo, ' +
      '3 Tipos de hallazgo, 5 Etapas constructivas, 6 Etapas de nido, 4 Obras.'
  )
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
