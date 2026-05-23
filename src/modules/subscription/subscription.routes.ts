import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { PLAN_FEATURES, ALL_FEATURES, getLockedFeatures } from '../../config/plans';
import { db } from '../../database/client';
import { users, organizations } from '../../database/shema';
import { eq } from 'drizzle-orm';

export async function subscriptionRoutes(app: FastifyInstance) {
    app.get('/me/features', { preHandler: authMiddleware }, async (req: FastifyRequest, reply: FastifyReply) => {
        const plano = req.user.plano;

        // Busca data de expiração para retornar ao frontend
        let plano_expira_em: Date | null = null;

        if (req.user.organization_id) {
            const [org] = await db
                .select({ plano_expira_em: organizations.plano_expira_em })
                .from(organizations)
                .where(eq(organizations.id, req.user.organization_id))
                .limit(1);
            plano_expira_em = org?.plano_expira_em ?? null;
        } else {
            const [user] = await db
                .select({ plano_expira_em: users.plano_expira_em })
                .from(users)
                .where(eq(users.id, req.user.id))
                .limit(1);
            plano_expira_em = user?.plano_expira_em ?? null;
        }

        return reply.send({
            plano,
            plano_expira_em,
            features_ativas: PLAN_FEATURES[plano] ?? [],
            features_bloqueadas: getLockedFeatures(plano),
        });
    });
}
