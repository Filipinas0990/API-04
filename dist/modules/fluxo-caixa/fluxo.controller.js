"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fluxoController = void 0;
const fluxo_schema_1 = require("./fluxo.schema");
const fluxo_repository_1 = require("./fluxo.repository");
exports.fluxoController = {
    async list(req, reply) {
        const { tipo, status, categoria } = req.query;
        const fluxos = await fluxo_repository_1.fluxoRepository.findAll(req.user.id, { tipo, status, categoria });
        return reply.send(fluxos);
    },
    async create(req, reply) {
        const data = fluxo_schema_1.createFluxoSchema.parse(req.body);
        const fluxo = await fluxo_repository_1.fluxoRepository.create(req.user.id, data);
        return reply.status(201).send(fluxo);
    },
    async getById(req, reply) {
        const { id } = req.params;
        const fluxo = await fluxo_repository_1.fluxoRepository.findById(id, req.user.id);
        if (!fluxo) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lançamento não encontrado' });
        }
        return reply.send(fluxo);
    },
    async update(req, reply) {
        const { id } = req.params;
        const data = fluxo_schema_1.updateFluxoSchema.parse(req.body);
        const fluxo = await fluxo_repository_1.fluxoRepository.update(id, req.user.id, data);
        if (!fluxo) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lançamento não encontrado' });
        }
        return reply.send(fluxo);
    },
    async remove(req, reply) {
        const { id } = req.params;
        const fluxo = await fluxo_repository_1.fluxoRepository.delete(id, req.user.id);
        if (!fluxo) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lançamento não encontrado' });
        }
        return reply.status(204).send();
    },
    async getSaldo(req, reply) {
        const saldo = await fluxo_repository_1.fluxoRepository.getSaldo(req.user.id);
        return reply.send(saldo);
    },
};
//# sourceMappingURL=fluxo.controller.js.map