"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRoutes = leadRoutes;
const lead_controller_1 = require("./lead.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function leadRoutes(app) {
    // Todas as rotas de leads são protegidas
    app.addHook('preHandler', auth_middleware_1.authMiddleware);
    app.get('/', lead_controller_1.leadController.list);
    app.post('/', lead_controller_1.leadController.create);
    app.get('/pipeline', lead_controller_1.leadController.getPipeline);
    app.get('/:id', lead_controller_1.leadController.getById);
    app.put('/:id', lead_controller_1.leadController.update);
    app.delete('/:id', lead_controller_1.leadController.remove);
    app.patch('/:id/status', lead_controller_1.leadController.updateStatus);
}
//# sourceMappingURL=lead.routes.js.map