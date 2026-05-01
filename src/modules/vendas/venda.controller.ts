import { FastifyRequest, FastifyReply } from 'fastify';
import { createVendaSchema, updateVendaSchema, updateStatusSchema } from './venda.schema';
import { vendaRepository } from './venda.repository';

export const vendaController = {
    async list(req: FastifyRequest, reply: FastifyReply) {
        const { status, tipo } = req.query as Record<string, string>;
        const vendas = await vendaRepository.findAll(req.user.id, { status, tipo });
        return reply.send(vendas);
    },

    async create(req: FastifyRequest, reply: FastifyReply) {
        const data = createVendaSchema.parse(req.body);
        const venda = await vendaRepository.create(req.user.id, data);
        return reply.status(201).send(venda);
    },

    async getById(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const venda = await vendaRepository.findById(id, req.user.id);
        if (!venda) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Venda não encontrada' });
        }
        return reply.send(venda);
    },

    async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = updateVendaSchema.parse(req.body);
        const venda = await vendaRepository.update(id, req.user.id, data);
        if (!venda) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Venda não encontrada' });
        }
        return reply.send(venda);
    },

    async remove(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const venda = await vendaRepository.delete(id, req.user.id);
        if (!venda) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Venda não encontrada' });
        }
        return reply.status(204).send();
    },

    async updateStatus(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const { status } = updateStatusSchema.parse(req.body);
        const venda = await vendaRepository.update(id, req.user.id, { status });
        if (!venda) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Venda não encontrada' });
        }
        return reply.send(venda);
    },

    async getResumo(req: FastifyRequest, reply: FastifyReply) {
        const resumo = await vendaRepository.getResumo(req.user.id);
        return reply.send(resumo);
    },
};