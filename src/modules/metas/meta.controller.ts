import { FastifyRequest, FastifyReply } from 'fastify';
import { createMetaSchema, updateMetaSchema } from './meta.schema';
import { metaRepository } from './meta.repository';

export const metaController = {
    async list(req: FastifyRequest, reply: FastifyReply) {
        const result = await metaRepository.findAll(req.user.id);
        return reply.send(result);
    },

    async create(req: FastifyRequest, reply: FastifyReply) {
        const data = createMetaSchema.parse(req.body);
        const meta = await metaRepository.create(req.user.id, data);
        return reply.status(201).send(meta);
    },

    async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = updateMetaSchema.parse(req.body);
        const meta = await metaRepository.update(id, req.user.id, data);
        if (!meta) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Meta não encontrada' });
        }
        return reply.send(meta);
    },

    async remove(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const meta = await metaRepository.delete(id, req.user.id);
        if (!meta) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Meta não encontrada' });
        }
        return reply.status(204).send();
    },
};
