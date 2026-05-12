"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitaController = void 0;
const visita_schema_1 = require("./visita.schema");
const visita_repository_1 = require("./visita.repository");
exports.visitaController = {
    async list(req, reply) {
        const { status, lead_id, imovel_id } = req.query;
        const visitas = await visita_repository_1.visitaRepository.findAll(req.user.id, { status, lead_id, imovel_id });
        return reply.send(visitas);
    },
    async create(req, reply) {
        const data = visita_schema_1.createVisitaSchema.parse(req.body);
        const visita = await visita_repository_1.visitaRepository.create(req.user.id, data);
        return reply.status(201).send(visita);
    },
    async getById(req, reply) {
        const { id } = req.params;
        const visita = await visita_repository_1.visitaRepository.findById(id, req.user.id);
        if (!visita) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Visita não encontrada' });
        }
        return reply.send(visita);
    },
    async update(req, reply) {
        const { id } = req.params;
        const data = visita_schema_1.updateVisitaSchema.parse(req.body);
        const visita = await visita_repository_1.visitaRepository.update(id, req.user.id, data);
        if (!visita) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Visita não encontrada' });
        }
        return reply.send(visita);
    },
    async updateStatus(req, reply) {
        const { id } = req.params;
        const { status } = visita_schema_1.updateStatusSchema.parse(req.body);
        const visita = await visita_repository_1.visitaRepository.update(id, req.user.id, { status });
        if (!visita) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Visita não encontrada' });
        }
        return reply.send(visita);
    },
    async remove(req, reply) {
        const { id } = req.params;
        const visita = await visita_repository_1.visitaRepository.delete(id, req.user.id);
        if (!visita) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Visita não encontrada' });
        }
        return reply.status(204).send();
    },
};
//# sourceMappingURL=visita.controller.js.map