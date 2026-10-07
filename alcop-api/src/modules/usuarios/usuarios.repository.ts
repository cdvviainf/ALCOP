import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import type { PaginationQuery } from '../../shared/pagination.js'
import { toPrismaRange } from '../../shared/pagination.js'

const perfilSelect = { select: { id: true, nombre: true } } as const

/** Acceso a datos de Usuario (CLAUDE.md §12.2). */
export const usuariosRepository = {
  /** Usuario de la sesión + perfil con permisos efectivos (para /me). */
  async obtenerParaSesion(id: string) {
    return prisma.usuario.findFirst({
      where: { id, eliminadoEn: null, activo: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        esAdmin: true,
        perfil: {
          select: {
            id: true,
            nombre: true,
            areaPrevencion: true,
            areaTecnica: true,
            permisos: {
              select: { nivel: true, funcion: { select: { codigo: true, area: true } } },
            },
          },
        },
      },
    })
  },

  async listar(pagination: PaginationQuery, q?: string) {
    const where: Prisma.UsuarioWhereInput = {
      eliminadoEn: null,
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const { skip, take } = toPrismaRange(pagination)
    const [rows, total] = await prisma.$transaction([
      prisma.usuario.findMany({
        where,
        skip,
        take,
        orderBy: { creadoEn: 'desc' },
        include: { perfil: perfilSelect },
      }),
      prisma.usuario.count({ where }),
    ])
    return { rows, total }
  },

  async buscarPorId(id: string) {
    return prisma.usuario.findFirst({
      where: { id, eliminadoEn: null },
      include: { perfil: perfilSelect },
    })
  },

  async buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email }, select: { id: true } })
  },

  async _fijarCredencial(tx: Prisma.TransactionClient, authUserId: string, passwordHash: string) {
    const cuenta = await tx.account.findFirst({
      where: { userId: authUserId, providerId: 'credential' },
      select: { id: true },
    })
    if (cuenta) {
      await tx.account.update({ where: { id: cuenta.id }, data: { password: passwordHash } })
    } else {
      await tx.account.create({
        data: {
          id: randomUUID(),
          userId: authUserId,
          accountId: authUserId,
          providerId: 'credential',
          password: passwordHash,
        },
      })
    }
  },

  /** Alta atómica: identidad Better Auth + Usuario de dominio (QA-C-002). */
  async crearConCredencial(data: {
    nombre: string
    email: string
    esAdmin: boolean
    perfilId: number | null
    passwordHash: string
    creadoPor: string
  }) {
    return prisma.$transaction(async (tx) => {
      let authUser = await tx.user.findUnique({ where: { email: data.email } })
      if (!authUser) {
        authUser = await tx.user.create({
          data: { email: data.email, name: data.nombre, emailVerified: false },
        })
      }
      await this._fijarCredencial(tx, authUser.id, data.passwordHash)
      return tx.usuario.create({
        data: {
          nombre: data.nombre,
          email: data.email,
          esAdmin: data.esAdmin,
          perfilId: data.perfilId,
          authUserId: authUser.id,
          activo: true,
          creadoPor: data.creadoPor,
        },
        include: { perfil: perfilSelect },
      })
    })
  },

  async actualizar(
    id: string,
    data: {
      nombre?: string
      esAdmin?: boolean
      perfilId?: number | null
      activo?: boolean
      passwordHash?: string
      authUserId?: string | null
    }
  ) {
    return prisma.$transaction(async (tx) => {
      if (data.passwordHash && data.authUserId) {
        await this._fijarCredencial(tx, data.authUserId, data.passwordHash)
      }
      return tx.usuario.update({
        where: { id },
        data: {
          ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
          ...(data.esAdmin !== undefined ? { esAdmin: data.esAdmin } : {}),
          ...(data.perfilId !== undefined ? { perfilId: data.perfilId } : {}),
          ...(data.activo !== undefined ? { activo: data.activo } : {}),
        },
        include: { perfil: perfilSelect },
      })
    })
  },

  async retirar(id: string, eliminar: boolean, eliminadoPor: string) {
    return prisma.$transaction(async (tx) => {
      await tx.usuarioObra.updateMany({
        where: { usuarioId: id, eliminadoEn: null },
        data: { eliminadoEn: new Date(), eliminadoPor },
      })
      return tx.usuario.update({
        where: { id },
        data: eliminar ? { eliminadoEn: new Date(), activo: false } : { activo: false },
      })
    })
  },

  async contarRespuestasDesde(usuarioId: string, desde: Date) {
    return prisma.respuestaFormulario.count({ where: { usuarioId, fechaHora: { gte: desde } } })
  },
}
