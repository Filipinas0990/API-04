"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFeature = requireFeature;
const plans_1 = require("../config/plans");
function requireFeature(feature) {
    return async (req, reply) => {
        const plano = req.user?.plano ?? 'basic';
        if (!(0, plans_1.hasFeature)(plano, feature)) {
            return reply.status(403).send({
                error: 'PLANO_INSUFICIENTE',
                message: 'Esta funcionalidade não está disponível no seu plano atual.',
                feature,
                plano_atual: plano,
            });
        }
    };
}
//# sourceMappingURL=plan.middleware.js.map