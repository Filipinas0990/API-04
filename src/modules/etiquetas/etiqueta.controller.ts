import { FastifyRequest, FastifyReply } from 'fastify';
import { createEtiquetaSchema, updateEtiquetaSchema } from './etiqueta.schema';
import { etiquetaRepository } from './etiqueta.repository';
import { leadRepository } from '../leads/lead.repository';

export const etiquetaController = {
    async list(req: FastifyRequest, reply: FastifyReply) {
        const result = await etiquetaRepository.findAll(req.user.id);
        return reply.send(result);
    },

    async create(req: FastifyRequest, reply: FastifyReply) {
        const data = createEtiquetaSchema.parse(req.body);
        const etiqueta = await etiquetaRepository.create(req.user.id, data);
        return reply.status(201).send(etiqueta);
    },

    async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = updateEtiquetaSchema.parse(req.body);
        const etiqueta = await etiquetaRepository.update(id, req.user.id, data);
        if (!etiqueta) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Etiqueta não encontrada' });
        }
        return reply.send(etiqueta);
    },

    async remove(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const etiqueta = await etiquetaRepository.delete(id, req.user.id);
        if (!etiqueta) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Etiqueta não encontrada' });
        }
        return reply.status(204).send();
    },

    async getStats(req: FastifyRequest, reply: FastifyReply) {
        const stats = await etiquetaRepository.getStats(req.user.id);
        return reply.send(stats);
    },

    async addToLead(req: FastifyRequest, reply: FastifyReply) {
        const { id: leadId, etiquetaId } = req.params as { id: string; etiquetaId: string };

        const lead = await leadRepository.findById(leadId, req.user.id);
        if (!lead) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lead não encontrado' });
        }

        const etiqueta = await etiquetaRepository.findById(etiquetaId, req.user.id);
        if (!etiqueta) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Etiqueta não encontrada' });
        }

        await etiquetaRepository.addToLead(leadId, etiquetaId);
        return reply.status(201).send({ ok: true });
    },

    async removeFromLead(req: FastifyRequest, reply: FastifyReply) {
        const { id: leadId, etiquetaId } = req.params as { id: string; etiquetaId: string };

        const lead = await leadRepository.findById(leadId, req.user.id);
        if (!lead) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lead não encontrado' });
        }

        await etiquetaRepository.removeFromLead(leadId, etiquetaId);
        return reply.status(204).send();
    },
};
