import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import type { PaginationQuery } from '../../shared/pagination.js'
import { toPrismaRange } from '../../shared/pagination.js'

const perfilSelect = {
  select: { id: true, nombre: true, nivelPrevencion: true, nivelTecnica: true },
} as const

/** Acceso a datos de Usuario (CLAUDE.md §12.2). */
export const usuariosRepository = {
  /** Usuario activo + su perfil, por id de dominio. Solo campos no sensibles. */
  async obtenerConPerfil(id: string) {
    return prisma.usuario.findFirst({
      where: { id, eliminadoEn: null, activo: true },
      select: { id: true, nombre: true, email: true, perfil: perfilSelect },
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

  /** ¿El email ya está en uso por algún Usuario (incluye soft-deleted, por el @unique)? */
  async buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email }, select: { id: true } })
  },

  /** Fija la credencial `credential` del usuario Better Auth dentro de una tx. */
  async _fijarCredencial(
    tx: Prisma.TransactionClient,
    authUserId: string,
    passwordHash: string
  ) {
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

  /**
   * Alta atómica (QA-C-002): identidad Better Auth (auth_user + auth_account
   * credential) + Usuario de dominio en una sola transacción Prisma. Si algo
   * falla, rollback total — nunca quedan identidades huérfanas. El hash lo
   * calcula el service (no es query); acá solo persistimos (CLAUDE.md §12.2/§12.3).
   */
  async crearConCredencial(data: {
    nombre: string
    email: string
    perfilId: number
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
          perfilId: data.perfilId,
          authUserId: authUser.id,
          activo: true,
          creadoPor: data.creadoPor,
        },
        include: { perfil: perfilSelect },
      })
    })
  },

  /** Actualización atómica: credencial (si se resetea) + Usuario, con rollback conjunto. */
  async actualizar(
    id: string,
    data: {
      nombre?: string
      perfilId?: number
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
          ...(data.perfilId !== undefined ? { perfilId: data.perfilId } : {}),
          ...(data.activo !== undefined ? { activo: data.activo } : {}),
        },
        include: { perfil: perfilSelect },
      })
    })
  },

  /**
   * Retira a un usuario del servicio en una transacción (CLAUDE.md §12.3):
   * siempre borra sus asignaciones `UsuarioObra` (ya no puede ser titular — QA-C-004)
   * y, según `eliminar`, lo soft-deletea o solo lo desactiva (QA-C-003).
   */
  async retirar(id: string, eliminar: boolean) {
    return prisma.$transaction(async (tx) => {
      await tx.usuarioObra.deleteMany({ where: { usuarioId: id } })
      return tx.usuario.update({
        where: { id },
        data: eliminar ? { eliminadoEn: new Date(), activo: false } : { activo: false },
      })
    })
  },

  /** Respuestas de formulario registradas por el usuario desde `desde` (guard de 90 días). */
  async contarRespuestasDesde(usuarioId: string, desde: Date) {
    return prisma.respuestaFormulario.count({ where: { usuarioId, fechaHora: { gte: desde } } })
  },
}
