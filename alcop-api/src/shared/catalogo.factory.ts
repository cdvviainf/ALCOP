import type { FastifyInstance, FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'
import { Prisma } from '@prisma/client'
import { z, type ZodType } from 'zod'
import { ConflictError, NotFoundError } from './errors.js'
import { paginate, paginationQuerySchema, toPrismaRange } from './pagination.js'

/**
 * Factory de catálogos CRUD (Docs/plan-mantenedores.md §0).
 *
 * Genera el router Fastify estándar de un catálogo simple a partir de un
 * delegate Prisma + schemas Zod + authz, sin repetir el andamiaje de
 * nucleo/obras por cada tabla. Los catálogos con reglas propias (Usuario,
 * UsuarioObra) siguen implementándose explícitos.
 *
 * Supuestos del modelo (CLAUDE.md §5, §12.7): columnas `id Int`, `eliminadoEn`
 * (soft delete obligatorio) y, si `conUsuario`, `creadoPor`/`eliminadoPor`.
 */

/** Subconjunto del delegate Prisma que usa el factory (común a todos los modelos). */
export interface CatalogoDelegate {
  findMany: (args: unknown) => Promise<Record<string, unknown>[]>
  count: (args: unknown) => Promise<number>
  findFirst: (args: unknown) => Promise<Record<string, unknown> | null>
  create: (args: unknown) => Promise<Record<string, unknown>>
  update: (args: unknown) => Promise<Record<string, unknown>>
}

export interface CatalogoConfig<TCrear, TActualizar> {
  /** Segmento de ruta del recurso bajo el prefijo del módulo (p. ej. 'niveles-riesgo'). */
  ruta: string
  /** Nombre legible para mensajes NotFound (p. ej. 'Nivel de riesgo'). */
  recurso: string
  /** Tag de Swagger (módulo): 'nucleo' | 'prevencion' | 'tecnica' | ... */
  tag: string
  /** Delegate Prisma del modelo (p. ej. prisma.nivelRiesgo). */
  modelo: CatalogoDelegate
  /** Campo string sobre el que aplica la búsqueda `?q` (contains, insensitive). */
  campoBusqueda: string
  /** orderBy de Prisma para el listado (p. ej. [{ orden: 'asc' }, { id: 'asc' }]). */
  orderBy: unknown
  /** Schemas de validación del body. */
  schemas: { crear: ZodType<TCrear>; actualizar: ZodType<TActualizar> }
  /** Mapea una fila Prisma a su DTO público (CLAUDE.md §12.4). */
  toDTO: (row: Record<string, unknown>) => unknown
  /** preHandlers de autorización: `leer` para GET, `escribir` para POST/PATCH/DELETE. */
  authz: { leer: preHandlerHookHandler[]; escribir: preHandlerHookHandler[] }
  /** Genera el `codigo` único a partir del body en create. Omitir si el modelo no tiene `codigo`. */
  generarCodigo?: (data: TCrear) => string
  /** Si el modelo tiene columnas `creadoPor`/`eliminadoPor` (default true). */
  conUsuario?: boolean
}

const idParamSchema = z.object({ id: z.coerce.number().int().positive() })

function esConflictoUnico(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

/**
 * Devuelve un plugin Fastify con las 5 rutas estándar del catálogo. Montarlo con
 * el prefijo del módulo, p. ej.: `app.register(nivelesRiesgoRoutes, { prefix: '/api/prevencion' })`.
 */
export function crearCatalogoRoutes<TCrear, TActualizar>(
  config: CatalogoConfig<TCrear, TActualizar>
) {
  const { ruta, recurso, tag, modelo, campoBusqueda, orderBy, schemas, toDTO, authz } = config
  const conUsuario = config.conUsuario ?? true

  const listarQuerySchema = paginationQuerySchema.extend({
    q: z.string().trim().min(1).optional(),
  })

  return async function catalogoRoutes(app: FastifyInstance) {
    app.get(
      `/${ruta}`,
      { preHandler: authz.leer, schema: { tags: [tag], summary: `Listar ${recurso} (paginado)` } },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { page, limit, q } = listarQuerySchema.parse(request.query)
        const where: Record<string, unknown> = {
          eliminadoEn: null,
          ...(q ? { [campoBusqueda]: { contains: q, mode: 'insensitive' } } : {}),
        }
        const { skip, take } = toPrismaRange({ page, limit })
        const [rows, total] = await Promise.all([
          modelo.findMany({ where, skip, take, orderBy }),
          modelo.count({ where }),
        ])
        return reply.send(paginate(rows.map(toDTO), total, { page, limit }))
      }
    )

    app.get(
      `/${ruta}/:id`,
      { preHandler: authz.leer, schema: { tags: [tag], summary: `Detalle de ${recurso}` } },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = idParamSchema.parse(request.params)
        const row = await modelo.findFirst({ where: { id, eliminadoEn: null } })
        if (!row) throw new NotFoundError(recurso, String(id))
        return reply.send(toDTO(row))
      }
    )

    app.post(
      `/${ruta}`,
      { preHandler: authz.escribir, schema: { tags: [tag], summary: `Crear ${recurso}` } },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const data = schemas.crear.parse(request.body)
        const extra: Record<string, unknown> = {}
        if (config.generarCodigo) extra.codigo = config.generarCodigo(data)
        if (conUsuario) extra.creadoPor = request.usuarioId ?? 'system'
        try {
          const row = await modelo.create({ data: { ...data, ...extra } })
          return reply.status(201).send(toDTO(row))
        } catch (err) {
          if (esConflictoUnico(err)) throw new ConflictError(`Ya existe un(a) ${recurso} con ese valor.`)
          throw err
        }
      }
    )

    app.patch(
      `/${ruta}/:id`,
      { preHandler: authz.escribir, schema: { tags: [tag], summary: `Actualizar ${recurso}` } },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = idParamSchema.parse(request.params)
        const data = schemas.actualizar.parse(request.body)
        const existente = await modelo.findFirst({ where: { id, eliminadoEn: null } })
        if (!existente) throw new NotFoundError(recurso, String(id))
        try {
          const row = await modelo.update({ where: { id }, data: data as Record<string, unknown> })
          return reply.send(toDTO(row))
        } catch (err) {
          if (esConflictoUnico(err)) throw new ConflictError(`Ya existe un(a) ${recurso} con ese valor.`)
          throw err
        }
      }
    )

    app.delete(
      `/${ruta}/:id`,
      { preHandler: authz.escribir, schema: { tags: [tag], summary: `Eliminar ${recurso} (soft delete)` } },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = idParamSchema.parse(request.params)
        const existente = await modelo.findFirst({ where: { id, eliminadoEn: null } })
        if (!existente) throw new NotFoundError(recurso, String(id))
        await modelo.update({
          where: { id },
          data: {
            eliminadoEn: new Date(),
            ...(conUsuario ? { eliminadoPor: request.usuarioId ?? 'system' } : {}),
          },
        })
        return reply.status(204).send()
      }
    )
  }
}
