import { FastifyRequest, FastifyReply } from 'fastify';
import { createImovelSchema, updateImovelSchema } from './imovel.schema';
import { imovelRepository } from './imovel.repository';

export const imovelController = {
    async list(req: FastifyRequest, reply: FastifyReply) {
        const { tipo, status, cidade, preco_min, preco_max, search } = req.query as Record<string, string>;
        const imoveis = await imovelRepository.findAll(req.user.id, {
            tipo, status, cidade, search,
            preco_min: preco_min ? Number(preco_min) : undefined,
            preco_max: preco_max ? Number(preco_max) : undefined,
        });
        return reply.send(imoveis);
    },

    async create(req: FastifyRequest, reply: FastifyReply) {
        const data = createImovelSchema.parse(req.body);
        const imovel = await imovelRepository.create(req.user.id, data);
        return reply.status(201).send(imovel);
    },

    async getById(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const imovel = await imovelRepository.findById(id, req.user.id);
        if (!imovel) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Imóvel não encontrado' });
        }
        return reply.send(imovel);
    },

    async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = updateImovelSchema.parse(req.body);
        const imovel = await imovelRepository.update(id, req.user.id, data);
        if (!imovel) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Imóvel não encontrado' });
        }
        return reply.send(imovel);
    },

    async remove(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const imovel = await imovelRepository.delete(id, req.user.id);
        if (!imovel) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Imóvel não encontrado' });
        }
        return reply.status(204).send();
    },
};