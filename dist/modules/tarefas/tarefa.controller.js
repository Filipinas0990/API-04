"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tarefaController = void 0;
const tarefa_schema_1 = require("./tarefa.schema");
const tarefa_repository_1 = require("./tarefa.repository");
exports.tarefaController = {
    async list(req, reply) {
        const { status, prioridade, lead_id } = req.query;
        const tarefas = await tarefa_repository_1.tarefaRepository.findAll(req.user.id, { status, prioridade, lead_id });
        return reply.send(tarefas);
    },
    async create(req, reply) {
        const data = tarefa_schema_1.createTarefaSchema.parse(req.body);
        const tarefa = await tarefa_repository_1.tarefaRepository.create(req.user.id, data);
        return reply.status(201).send(tarefa);
    },
    async getById(req, reply) {
        const { id } = req.params;
        const tarefa = await tarefa_repository_1.tarefaRepository.findById(id, req.user.id);
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.send(tarefa);
    },
    async update(req, reply) {
        const { id } = req.params;
        const data = tarefa_schema_1.updateTarefaSchema.parse(req.body);
        const tarefa = await tarefa_repository_1.tarefaRepository.update(id, req.user.id, data);
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.send(tarefa);
    },
    async concluir(req, reply) {
        const { id } = req.params;
        const tarefa = await tarefa_repository_1.tarefaRepository.concluir(id, req.user.id);
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.send(tarefa);
    },
    async updateStatus(req, reply) {
        const { id } = req.params;
        const { status } = tarefa_schema_1.updateStatusSchema.parse(req.body);
        const tarefa = await tarefa_repository_1.tarefaRepository.update(id, req.user.id, { status });
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.send(tarefa);
    },
    async remove(req, reply) {
        const { id } = req.params;
        const tarefa = await tarefa_repository_1.tarefaRepository.delete(id, req.user.id);
        if (!tarefa) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Tarefa não encontrada' });
        }
        return reply.status(204).send();
    },
};
//# sourceMappingURL=tarefa.controller.js.map