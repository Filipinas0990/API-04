"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const admin_repository_1 = require("./admin.repository");
const zod_1 = require("zod");
const plans_1 = require("../../config/plans");
const setPlanSchema = zod_1.z.object({
    plano: zod_1.z.enum(['basic', 'premium', 'gold']),
    expira_em: zod_1.z.string().datetime().optional().nullable(),
});
exports.adminController = {
    async listClientes(req, reply) {
        const { corretores, imobiliarias } = await admin_repository_1.adminRepository.listTodosClientes();
        const corretoresComFeatures = corretores.map(c => {
            const plano = (c.plano ?? 'basic');
            const expirado = c.plano_expira_em && c.plano_expira_em < new Date();
            const planoEfetivo = (c.plano_status !== 'active' || expirado) ? 'basic' : plano;
            return {
                ...c,
                tipo: 'corretor',
                plano_efetivo: planoEfetivo,
                features_ativas: plans_1.PLAN_FEATURES[planoEfetivo],
                features_bloqueadas: (0, plans_1.getLockedFeatures)(planoEfetivo),
            };
        });
        const imobiliariasComFeatures = imobiliarias.map(o => {
            const plano = (o.plano ?? 'basic');
            const expirado = o.plano_expira_em && o.plano_expira_em < new Date();
            const planoEfetivo = (o.plano_status !== 'active' || expirado) ? 'basic' : plano;
            return {
                ...o,
                tipo: 'imobiliaria',
                plano_efetivo: planoEfetivo,
                features_ativas: plans_1.PLAN_FEATURES[planoEfetivo],
                features_bloqueadas: (0, plans_1.getLockedFeatures)(planoEfetivo),
            };
        });
        return reply.send({
            total_corretores: corretoresComFeatures.length,
            total_imobiliarias: imobiliariasComFeatures.length,
            corretores: corretoresComFeatures,
            imobiliarias: imobiliariasComFeatures,
        });
    },
    async listCorretores(req, reply) {
        const corretores = await admin_repository_1.adminRepository.listCorretores();
        return reply.send(corretores);
    },
    async listImobiliarias(req, reply) {
        const imobiliarias = await admin_repository_1.adminRepository.listImobiliarias();
        return reply.send(imobiliarias);
    },
    async setUserPlan(req, reply) {
        const body = setPlanSchema.parse(req.body);
        const expira_em = body.expira_em ? new Date(body.expira_em) : null;
        const updated = await admin_repository_1.adminRepository.setUserPlan(req.params.id, body.plano, expira_em);
        if (!updated) {
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        }
        return reply.send({ message: 'Plano atualizado com sucesso', data: updated });
    },
    async setOrgPlan(req, reply) {
        const body = setPlanSchema.parse(req.body);
        const expira_em = body.expira_em ? new Date(body.expira_em) : null;
        const updated = await admin_repository_1.adminRepository.setOrgPlan(req.params.id, body.plano, expira_em);
        if (!updated) {
            return reply.status(404).send({ error: 'Organização não encontrada' });
        }
        return reply.send({ message: 'Plano da imobiliária atualizado — todos os corretores vinculados herdam automaticamente.', data: updated });
    },
    async deactivateUserPlan(req, reply) {
        const updated = await admin_repository_1.adminRepository.deactivateUserPlan(req.params.id);
        if (!updated) {
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        }
        return reply.send({ message: 'Plano cancelado. Usuário rebaixado para basic.', data: updated });
    },
    async deactivateOrgPlan(req, reply) {
        const updated = await admin_repository_1.adminRepository.deactivateOrgPlan(req.params.id);
        if (!updated) {
            return reply.status(404).send({ error: 'Organização não encontrada' });
        }
        return reply.send({ message: 'Plano da imobiliária cancelado. Rebaixado para basic.', data: updated });
    },
};
//# sourceMappingURL=admin.controller.js.map