import { FastifyRequest, FastifyReply } from 'fastify';
import { createFluxoSchema, updateFluxoSchema } from './fluxo.schema';
import { fluxoRepository } from './fluxo.repository';

export const fluxoController = {
    async list(req: FastifyRequest, reply: FastifyReply) {
        const { tipo, status, categoria } = req.query as Record<string, string>;
        const fluxos = await fluxoRepository.findAll(req.user.id, { tipo, status, categoria });
        return reply.send(fluxos);
    },

    async create(req: FastifyRequest, reply: FastifyReply) {
        const data = createFluxoSchema.parse(req.body);
        const fluxo = await fluxoRepository.create(req.user.id, data);
        return reply.status(201).send(fluxo);
    },

    async getById(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const fluxo = await fluxoRepository.findById(id, req.user.id);
        if (!fluxo) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lançamento não encontrado' });
        }
        return reply.send(fluxo);
    },

    async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = updateFluxoSchema.parse(req.body);
        const fluxo = await fluxoRepository.update(id, req.user.id, data);
        if (!fluxo) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lançamento não encontrado' });
        }
        return reply.send(fluxo);
    },

    async remove(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const fluxo = await fluxoRepository.delete(id, req.user.id);
        if (!fluxo) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lançamento não encontrado' });
        }
        return reply.status(204).send();
    },

    async getSaldo(req: FastifyRequest, reply: FastifyReply) {
        const saldo = await fluxoRepository.getSaldo(req.user.id);
        return reply.send(saldo);
    },
};
