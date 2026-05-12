"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgRoutes = orgRoutes;
const org_controller_1 = require("./org.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function orgRoutes(app) {
    // Público — qualquer um pode ver info do convite pelo token
    app.get('/invites/:token', org_controller_1.orgController.getInviteByToken);
    // Corretor autenticado — aceitar convite
    app.register(async (authed) => {
        authed.addHook('preHandler', auth_middleware_1.authMiddleware);
        authed.post('/invites/:token/accept', org_controller_1.orgController.acceptInvite);
    });
    // Exclusivo para imobiliária owner
    app.register(async (imob) => {
        imob.addHook('preHandler', auth_middleware_1.authMiddleware);
        imob.addHook('preHandler', auth_middleware_1.requireImobiliaria);
        imob.get('/me', org_controller_1.orgController.getOrgMe);
        imob.patch('/me', org_controller_1.orgController.updateOrgMe);
        imob.get('/members', org_controller_1.orgController.listMembers);
        imob.delete('/members/:userId', org_controller_1.orgController.removeMember);
        imob.get('/invites', org_controller_1.orgController.listInvites);
        imob.post('/invites', org_controller_1.orgController.createInvite);
        imob.delete('/invites/:id', org_controller_1.orgController.cancelInvite);
        // Dashboard e visão consolidada da equipe
        imob.get('/dashboard', org_controller_1.orgController.getTeamDashboard);
        imob.get('/pipeline', org_controller_1.orgController.getOrgPipeline);
        imob.get('/equipe/leads', org_controller_1.orgController.listOrgLeads);
        imob.get('/equipe/vendas', org_controller_1.orgController.listOrgVendas);
    });
}
//# sourceMappingURL=org.routes.js.map