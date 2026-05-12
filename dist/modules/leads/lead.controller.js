"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadController = void 0;
const lead_shema_1 = require("./lead.shema");
const lead_repository_1 = require("./lead.repository");
exports.leadController = {
    async list(req, reply) {
        const { search, status } = req.query;
        const leads = await lead_repository_1.leadRepository.findAll(req.user.id, { search, status });
        return reply.send(leads);
    },
    async create(req, reply) {
        const data = lead_shema_1.createLeadSchema.parse(req.body);
        const lead = await lead_repository_1.leadRepository.create(req.user.id, data);
        return reply.status(201).send(lead);
    },
    async getById(req, reply) {
        const { id } = req.params;
        const lead = await lead_repository_1.leadRepository.findById(id, req.user.id);
        if (!lead) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Lead não encontrado',
            });
        }
        return reply.send(lead);
    },
    async update(req, reply) {
        const { id } = req.params;
        const data = lead_shema_1.updateLeadSchema.parse(req.body);
        const lead = await lead_repository_1.leadRepository.update(id, req.user.id, data);
        if (!lead) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Lead não encontrado',
            });
        }
        return reply.send(lead);
    },
    async remove(req, reply) {
        const { id } = req.params;
        const lead = await lead_repository_1.leadRepository.delete(id, req.user.id);
        if (!lead) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Lead não encontrado',
            });
        }
        return reply.status(204).send();
    },
    async updateStatus(req, reply) {
        const { id } = req.params;
        const { status } = lead_shema_1.updateStatusSchema.parse(req.body);
        const lead = await lead_repository_1.leadRepository.update(id, req.user.id, { status });
        if (!lead) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Lead não encontrado',
            });
        }
        return reply.send(lead);
    },
    async getPipeline(req, reply) {
        const pipeline = await lead_repository_1.leadRepository.getPipeline(req.user.id);
        return reply.send(pipeline);
    },
};
//# sourceMappingURL=lead.controller.js.map