import { FastifyRequest, FastifyReply } from 'fastify';
import { createLeadSchema, updateLeadSchema, updateStatusSchema } from './lead.shema';
import { leadRepository } from './lead.repository';

export const leadController = {
    async list(req: FastifyRequest, reply: FastifyReply) {
        const { search, status } = req.query as { search?: string; status?: string };
        const leads = await leadRepository.findAll(req.user.id, { search, status });
        return reply.send(leads);
    },

    async create(req: FastifyRequest, reply: FastifyReply) {
        const data = createLeadSchema.parse(req.body);
        const lead = await leadRepository.create(req.user.id, data);
        return reply.status(201).send(lead);
    },

    async getById(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const lead = await leadRepository.findById(id, req.user.id);

        if (!lead) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Lead não encontrado',
            });
        }

        return reply.send(lead);
    },

    async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = updateLeadSchema.parse(req.body);
        const lead = await leadRepository.update(id, req.user.id, data);

        if (!lead) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Lead não encontrado',
            });
        }

        return reply.send(lead);
    },

    async remove(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const lead = await leadRepository.delete(id, req.user.id);

        if (!lead) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Lead não encontrado',
            });
        }

        return reply.status(204).send();
    },

    async updateStatus(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const { status } = updateStatusSchema.parse(req.body);
        const lead = await leadRepository.update(id, req.user.id, { status });

        if (!lead) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Lead não encontrado',
            });
        }

        return reply.send(lead);
    },

    async getPipeline(req: FastifyRequest, reply: FastifyReply) {
        const pipeline = await leadRepository.getPipeline(req.user.id);
        return reply.send(pipeline);
    },
};