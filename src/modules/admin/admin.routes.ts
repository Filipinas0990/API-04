import { FastifyInstance } from 'fastify';
import { adminController } from './admin.controller';
import { requireAdmin } from '../../middlewares/auth.middleware';

export async function adminRoutes(app: FastifyInstance) {
    app.addHook('preHandler', requireAdmin);

    // Visão geral — todos os clientes com features
    app.get('/clientes', adminController.listClientes);

    // Listagens separadas
    app.get('/corretores', adminController.listCorretores);
    app.get('/imobiliarias', adminController.listImobiliarias);

    // Gerenciar plano de corretores autônomos
    app.patch('/corretores/:id/plano', adminController.setUserPlan);
    app.delete('/corretores/:id/plano', adminController.deactivateUserPlan);

    // Gerenciar plano de imobiliárias (repassa para todos os agentes)
    app.patch('/imobiliarias/:id/plano', adminController.setOrgPlan);
    app.delete('/imobiliarias/:id/plano', adminController.deactivateOrgPlan);
}
