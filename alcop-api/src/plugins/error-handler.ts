import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { BusinessError } from '../shared/errors.js'

export async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: error.flatten() },
      })
    }
    if (error instanceof BusinessError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      })
    }
    app.log.error(error)
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
    })
  })
}
