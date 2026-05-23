import { FastifyRequest, FastifyReply } from 'fastify';
import { hasFeature, type Feature } from '../config/plans';

export function requireFeature(feature: Feature) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        const plano = req.user?.plano ?? 'basic';

        if (!hasFeature(plano, feature)) {
            return reply.status(403).send({
                error: 'PLANO_INSUFICIENTE',
                message: 'Esta funcionalidade não está disponível no seu plano atual.',
                feature,
                plano_atual: plano,
            });
        }
    };
}
