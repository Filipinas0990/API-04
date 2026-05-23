import { FastifyRequest, FastifyReply } from 'fastify';
import { adminRepository } from './admin.repository';
import { z } from 'zod';
import type { Plano } from '../../config/plans';
import { PLAN_FEATURES, getLockedFeatures } from '../../config/plans';

const setPlanSchema = z.object({
    plano: z.enum(['basic', 'premium', 'gold']),
    expira_em: z.string().datetime().optional().nullable(),
});

export const adminController = {

    async listClientes(req: FastifyRequest, reply: FastifyReply) {
        const { corretores, imobiliarias } = await adminRepository.listTodosClientes();

        const corretoresComFeatures = corretores.map(c => {
            const plano = (c.plano ?? 'basic') as Plano;
            const expirado = c.plano_expira_em && c.plano_expira_em < new Date();
            const planoEfetivo: Plano = (c.plano_status !== 'active' || expirado) ? 'basic' : plano;
            return {
                ...c,
                tipo: 'corretor',
                plano_efetivo: planoEfetivo,
                features_ativas: PLAN_FEATURES[planoEfetivo],
                features_bloqueadas: getLockedFeatures(planoEfetivo),
            };
        });

        const imobiliariasComFeatures = imobiliarias.map(o => {
            const plano = (o.plano ?? 'basic') as Plano;
            const expirado = o.plano_expira_em && o.plano_expira_em < new Date();
            const planoEfetivo: Plano = (o.plano_status !== 'active' || expirado) ? 'basic' : plano;
            return {
                ...o,
                tipo: 'imobiliaria',
                plano_efetivo: planoEfetivo,
                features_ativas: PLAN_FEATURES[planoEfetivo],
                features_bloqueadas: getLockedFeatures(planoEfetivo),
            };
        });

        return reply.send({
            total_corretores: corretoresComFeatures.length,
            total_imobiliarias: imobiliariasComFeatures.length,
            corretores: corretoresComFeatures,
            imobiliarias: imobiliariasComFeatures,
        });
    },

    async listCorretores(req: FastifyRequest, reply: FastifyReply) {
        const corretores = await adminRepository.listCorretores();
        return reply.send(corretores);
    },

    async listImobiliarias(req: FastifyRequest, reply: FastifyReply) {
        const imobiliarias = await adminRepository.listImobiliarias();
        return reply.send(imobiliarias);
    },

    async setUserPlan(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const body = setPlanSchema.parse(req.body);
        const expira_em = body.expira_em ? new Date(body.expira_em) : null;

        const updated = await adminRepository.setUserPlan(req.params.id, body.plano as Plano, expira_em);

        if (!updated) {
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        }

        return reply.send({ message: 'Plano atualizado com sucesso', data: updated });
    },

    async setOrgPlan(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const body = setPlanSchema.parse(req.body);
        const expira_em = body.expira_em ? new Date(body.expira_em) : null;

        const updated = await adminRepository.setOrgPlan(req.params.id, body.plano as Plano, expira_em);

        if (!updated) {
            return reply.status(404).send({ error: 'Organização não encontrada' });
        }

        return reply.send({ message: 'Plano da imobiliária atualizado — todos os corretores vinculados herdam automaticamente.', data: updated });
    },

    async deactivateUserPlan(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const updated = await adminRepository.deactivateUserPlan(req.params.id);

        if (!updated) {
            return reply.status(404).send({ error: 'Usuário não encontrado' });
        }

        return reply.send({ message: 'Plano cancelado. Usuário rebaixado para basic.', data: updated });
    },

    async deactivateOrgPlan(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const updated = await adminRepository.deactivateOrgPlan(req.params.id);

        if (!updated) {
            return reply.status(404).send({ error: 'Organização não encontrada' });
        }

        return reply.send({ message: 'Plano da imobiliária cancelado. Rebaixado para basic.', data: updated });
    },
};
