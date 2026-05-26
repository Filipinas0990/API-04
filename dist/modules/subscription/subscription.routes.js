"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRoutes = subscriptionRoutes;
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const plans_1 = require("../../config/plans");
const client_1 = require("../../database/client");
const shema_1 = require("../../database/shema");
const drizzle_orm_1 = require("drizzle-orm");
async function subscriptionRoutes(app) {
    app.get('/me/features', { preHandler: auth_middleware_1.authMiddleware }, async (req, reply) => {
        const plano = req.user.plano;
        // Busca data de expiração para retornar ao frontend
        let plano_expira_em = null;
        if (req.user.organization_id) {
            const [org] = await client_1.db
                .select({ plano_expira_em: shema_1.organizations.plano_expira_em })
                .from(shema_1.organizations)
                .where((0, drizzle_orm_1.eq)(shema_1.organizations.id, req.user.organization_id))
                .limit(1);
            plano_expira_em = org?.plano_expira_em ?? null;
        }
        else {
            const [user] = await client_1.db
                .select({ plano_expira_em: shema_1.users.plano_expira_em })
                .from(shema_1.users)
                .where((0, drizzle_orm_1.eq)(shema_1.users.id, req.user.id))
                .limit(1);
            plano_expira_em = user?.plano_expira_em ?? null;
        }
        return reply.send({
            plano,
            plano_expira_em,
            features_ativas: plans_1.PLAN_FEATURES[plano] ?? [],
            features_bloqueadas: (0, plans_1.getLockedFeatures)(plano),
        });
    });
}
//# sourceMappingURL=subscription.routes.js.map