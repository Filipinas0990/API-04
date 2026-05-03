import { FastifyInstance } from 'fastify';
import { whatsappController } from './whatsapp.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function whatsappRoutes(app: FastifyInstance) {
    // Webhook público
    app.post('/webhook', whatsappController.webhook);

    app.register(async (protectedApp) => {
        protectedApp.addHook('preHandler', authMiddleware);

        // Status
        protectedApp.get('/status', whatsappController.getStatus);

        // Conversas
        protectedApp.get('/conversas', whatsappController.listConversas);
        protectedApp.patch('/conversas/:id', whatsappController.updateConversa);

        // Mensagens
        protectedApp.get('/conversas/:conversaId/mensagens', whatsappController.listMensagens);
        protectedApp.post('/send', whatsappController.sendMensagem);

        // Assistente IA
        protectedApp.post('/assistente', whatsappController.assistente);

        // Disparos
        protectedApp.get('/disparos', whatsappController.listDisparos);
        protectedApp.post('/disparos', whatsappController.iniciarDisparo);
        protectedApp.get('/disparos/limite', whatsappController.getLimiteDiario);
        protectedApp.get('/disparos/logs', whatsappController.listDisparoLogs);

        // Automações (legado)
        protectedApp.get('/automacoes', whatsappController.listAutomacoes);
        protectedApp.post('/automacoes', whatsappController.createAutomacao);
        protectedApp.put('/automacoes/:id', whatsappController.updateAutomacao);
        protectedApp.delete('/automacoes/:id', whatsappController.deleteAutomacao);

        // Automation Flows
        protectedApp.get('/flows', whatsappController.listFlows);
        protectedApp.post('/flows', whatsappController.createFlow);
        protectedApp.get('/flows/:id', whatsappController.getFlowById);
        protectedApp.put('/flows/:id', whatsappController.updateFlow);
        protectedApp.delete('/flows/:id', whatsappController.deleteFlow);

        // Automation Nodes
        protectedApp.get('/flows/:flowId/nodes', whatsappController.listNodes);
        protectedApp.post('/flows/:flowId/nodes', whatsappController.createNode);
        protectedApp.put('/nodes/:id', whatsappController.updateNode);
        protectedApp.delete('/nodes/:id', whatsappController.deleteNode);
    });



}