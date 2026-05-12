"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendaController = void 0;
const venda_schema_1 = require("./venda.schema");
const venda_repository_1 = require("./venda.repository");
exports.vendaController = {
    async list(req, reply) {
        const { status, tipo } = req.query;
        const vendas = await venda_repository_1.vendaRepository.findAll(req.user.id, { status, tipo });
        return reply.send(vendas);
    },
    async create(req, reply) {
        const data = venda_schema_1.createVendaSchema.parse(req.body);
        const venda = await venda_repository_1.vendaRepository.create(req.user.id, data);
        return reply.status(201).send(venda);
    },
    async getById(req, reply) {
        const { id } = req.params;
        const venda = await venda_repository_1.vendaRepository.findById(id, req.user.id);
        if (!venda) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Venda não encontrada' });
        }
        return reply.send(venda);
    },
    async update(req, reply) {
        const { id } = req.params;
        const data = venda_schema_1.updateVendaSchema.parse(req.body);
        const venda = await venda_repository_1.vendaRepository.update(id, req.user.id, data);
        if (!venda) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Venda não encontrada' });
        }
        return reply.send(venda);
    },
    async remove(req, reply) {
        const { id } = req.params;
        const venda = await venda_repository_1.vendaRepository.delete(id, req.user.id);
        if (!venda) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Venda não encontrada' });
        }
        return reply.status(204).send();
    },
    async updateStatus(req, reply) {
        const { id } = req.params;
        const { status } = venda_schema_1.updateStatusSchema.parse(req.body);
        const venda = await venda_repository_1.vendaRepository.update(id, req.user.id, { status });
        if (!venda) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Venda não encontrada' });
        }
        return reply.send(venda);
    },
    async getResumo(req, reply) {
        const resumo = await venda_repository_1.vendaRepository.getResumo(req.user.id);
        return reply.send(resumo);
    },
};
//# sourceMappingURL=venda.controller.js.map