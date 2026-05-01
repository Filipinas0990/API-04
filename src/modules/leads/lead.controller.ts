

import type { FastifyRequest, FastifyReply } from 'fastify'
import { leadRepository } from './lead.repository.js'
import { createLeadSchema, updateLeadSchema } from './lead.shema.js'
import { AppError } from '../../shared/errors/AppError.js'

type IdParams = { id: string }

export const leadController = {


    async list(_req: FastifyRequest, reply: FastifyReply) {
        const leads = leadRepository.findAll()
        return reply.send({ leads, total: leads.length })
    },


    async getById(req: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
        const lead = leadRepository.findById(req.params.id)

        if (!lead) {
            throw new AppError('Lead não encontrado', 404)
        }

        return reply.send({ lead })
    },


    async create(req: FastifyRequest, reply: FastifyReply) {

        const result = createLeadSchema.safeParse(req.body)

        if (!result.success) {

            const errors = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            }))
            throw new AppError(`Dados inválidos: ${errors[0].message}`, 422)
        }

        const lead = leadRepository.create(result.data)
        return reply.status(201).send({ lead })
    },


    async update(req: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
        const existing = leadRepository.findById(req.params.id)

        if (!existing) {
            throw new AppError('Lead não encontrado', 404)
        }

        const result = updateLeadSchema.safeParse(req.body)

        if (!result.success) {
            const errors = result.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            }))
            throw new AppError(`Dados inválidos: ${errors[0].message}`, 422)
        }

        const updated = leadRepository.update(req.params.id, result.data)
        return reply.send({ lead: updated })
    },


    async remove(req: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
        const deleted = leadRepository.delete(req.params.id)

        if (!deleted) {
            throw new AppError('Lead não encontrado', 404)
        }

        return reply.status(204).send()
    },
}