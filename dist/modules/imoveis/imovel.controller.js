"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imovelController = void 0;
const imovel_schema_1 = require("./imovel.schema");
const imovel_repository_1 = require("./imovel.repository");
exports.imovelController = {
    async list(req, reply) {
        const { tipo, status, cidade, preco_min, preco_max, search } = req.query;
        const imoveis = await imovel_repository_1.imovelRepository.findAll(req.user.id, {
            tipo, status, cidade, search,
            preco_min: preco_min ? Number(preco_min) : undefined,
            preco_max: preco_max ? Number(preco_max) : undefined,
        });
        return reply.send(imoveis);
    },
    async create(req, reply) {
        const data = imovel_schema_1.createImovelSchema.parse(req.body);
        const imovel = await imovel_repository_1.imovelRepository.create(req.user.id, data);
        return reply.status(201).send(imovel);
    },
    async getById(req, reply) {
        const { id } = req.params;
        const imovel = await imovel_repository_1.imovelRepository.findById(id, req.user.id);
        if (!imovel) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Imóvel não encontrado' });
        }
        return reply.send(imovel);
    },
    async update(req, reply) {
        const { id } = req.params;
        const data = imovel_schema_1.updateImovelSchema.parse(req.body);
        const imovel = await imovel_repository_1.imovelRepository.update(id, req.user.id, data);
        if (!imovel) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Imóvel não encontrado' });
        }
        return reply.send(imovel);
    },
    async remove(req, reply) {
        const { id } = req.params;
        const imovel = await imovel_repository_1.imovelRepository.delete(id, req.user.id);
        if (!imovel) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Imóvel não encontrado' });
        }
        return reply.status(204).send();
    },
};
//# sourceMappingURL=imovel.controller.js.map