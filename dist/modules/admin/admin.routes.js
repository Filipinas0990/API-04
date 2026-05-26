"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = adminRoutes;
const admin_controller_1 = require("./admin.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function adminRoutes(app) {
    app.addHook('preHandler', auth_middleware_1.requireAdmin);
    // Visão geral — todos os clientes com features
    app.get('/clientes', admin_controller_1.adminController.listClientes);
    // Listagens separadas
    app.get('/corretores', admin_controller_1.adminController.listCorretores);
    app.get('/imobiliarias', admin_controller_1.adminController.listImobiliarias);
    // Gerenciar plano de corretores autônomos
    app.patch('/corretores/:id/plano', admin_controller_1.adminController.setUserPlan);
    app.delete('/corretores/:id/plano', admin_controller_1.adminController.deactivateUserPlan);
    // Gerenciar plano de imobiliárias (repassa para todos os agentes)
    app.patch('/imobiliarias/:id/plano', admin_controller_1.adminController.setOrgPlan);
    app.delete('/imobiliarias/:id/plano', admin_controller_1.adminController.deactivateOrgPlan);
}
//# sourceMappingURL=admin.routes.js.map