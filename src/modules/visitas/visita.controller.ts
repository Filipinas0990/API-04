import { FastifyRequest, FastifyReply } from 'fastify';
import { createVisitaSchema, updateVisitaSchema, updateStatusSchema } from './visita.schema';
import { visitaRepository } from './visita.repository';

export const visitaController = {
    async list(req: FastifyRequest, reply: FastifyReply) {
        const { status, lead_id, imovel_id } = req.query as Record<string, string>;
        const visitas = await visitaRepository.findAll(req.user.id, { status, lead_id, imovel_id });
        return reply.send(visitas);
    },

    async create(req: FastifyRequest, reply: FastifyReply) {
        const data = createVisitaSchema.parse(req.body);
        const visita = await visitaRepository.create(req.user.id, data);
        return reply.status(201).send(visita);
    },

    async getById(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const visita = await visitaRepository.findById(id, req.user.id);
        if (!visita) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Visita não encontrada' });
        }
        return reply.send(visita);
    },

    async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = updateVisitaSchema.parse(req.body);
        const visita = await visitaRepository.update(id, req.user.id, data);
        if (!visita) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Visita não encontrada' });
        }
        return reply.send(visita);
    },

    async updateStatus(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const { status } = updateStatusSchema.parse(req.body);
        const visita = await visitaRepository.update(id, req.user.id, { status });
        if (!visita) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Visita não encontrada' });
        }
        return reply.send(visita);
    },

    async remove(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const visita = await visitaRepository.delete(id, req.user.id);
        if (!visita) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Visita não encontrada' });
        }
        return reply.status(204).send();
    },
};