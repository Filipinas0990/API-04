import { FastifyRequest, FastifyReply } from 'fastify';
import { createTarefaSchema, updateTarefaSchema, updateStatusSchema } from './tarefa.schema';
import { tarefaRepository } from './tarefa.repository';

export const tarefaController = {
    async list(req: FastifyRequest, reply: FastifyReply) {
        const { status, prioridade, lead_id } = req.query as Record<string, string>;
        const tarefas = await tarefaRepository.findAll(req.user.id, { status, prioridade, lead_id });
        return reply.send(tarefas);
    },

    async create(req: FastifyRequest, reply: FastifyReply) {
        const data = createTarefaSchema.parse(req.body);
        const tarefa = await tarefaRepository.create(req.user.id, data);
        return reply.status(201).send(tarefa);
    },

    async getById(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const tarefa = await tarefaRepository.findById(id, req.user.id);
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.send(tarefa);
    },

    async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = updateTarefaSchema.parse(req.body);
        const tarefa = await tarefaRepository.update(id, req.user.id, data);
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.send(tarefa);
    },

    async concluir(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const tarefa = await tarefaRepository.concluir(id, req.user.id);
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.send(tarefa);
    },

    async updateStatus(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const { status } = updateStatusSchema.parse(req.body);
        const tarefa = await tarefaRepository.update(id, req.user.id, { status });
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.send(tarefa);
    },

    async remove(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const tarefa = await tarefaRepository.delete(id, req.user.id);
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.status(204).send();
    },
};