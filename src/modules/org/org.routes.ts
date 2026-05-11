import { FastifyInstance } from 'fastify';
import { orgController } from './org.controller';
import { authMiddleware, requireImobiliaria } from '../../middlewares/auth.middleware';

export async function orgRoutes(app: FastifyInstance) {

    // Público — qualquer um pode ver info do convite pelo token
    app.get('/invites/:token', orgController.getInviteByToken);

    // Corretor autenticado — aceitar convite
    app.register(async (authed) => {
        authed.addHook('preHandler', authMiddleware);
        authed.post('/invites/:token/accept', orgController.acceptInvite);
    });

    // Exclusivo para imobiliária owner
    app.register(async (imob) => {
        imob.addHook('preHandler', authMiddleware);
        imob.addHook('preHandler', requireImobiliaria);

        imob.get('/me', orgController.getOrgMe);
        imob.patch('/me', orgController.updateOrgMe);

        imob.get('/members', orgController.listMembers);
        imob.delete('/members/:userId', orgController.removeMember);

        imob.get('/invites', orgController.listInvites);
        imob.post('/invites', orgController.createInvite);
        imob.delete('/invites/:id', orgController.cancelInvite);

        // Dashboard e visão consolidada da equipe
        imob.get('/dashboard', orgController.getTeamDashboard);
        imob.get('/pipeline', orgController.getOrgPipeline);
        imob.get('/equipe/leads', orgController.listOrgLeads);
        imob.get('/equipe/vendas', orgController.listOrgVendas);
    });
}
