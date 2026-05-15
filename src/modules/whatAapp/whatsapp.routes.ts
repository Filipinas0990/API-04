import { FastifyInstance } from 'fastify';
import { whatsappController } from './whatsapp.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function whatsappRoutes(app: FastifyInstance) {
    // Webhook público
    app.post('/webhook', whatsappController.webhook);

    // Serve arquivos de mídia enviados pelos corretores (sem auth — WhatsApp precisa acessar)
    app.get('/uploads/:filename', whatsappController.serveUpload);

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

        // Disparos (legado)
        protectedApp.get('/disparos', whatsappController.listDisparos);
        protectedApp.post('/disparos', whatsappController.iniciarDisparo);
        protectedApp.get('/disparos/limite', whatsappController.getLimiteDiario);
        protectedApp.get('/disparos/logs', whatsappController.listDisparoLogs);

        // Campanhas (novo — com intervalo anti-ban e execução em background)
        protectedApp.get('/campanhas', whatsappController.listDisparos);
        protectedApp.post('/campanhas', whatsappController.iniciarCampanha);
        protectedApp.get('/campanhas/:id/progresso', whatsappController.getProgresso);
        protectedApp.delete('/campanhas/:id', whatsappController.cancelarCampanha);

        // Automações (legado)
        protectedApp.get('/automacoes', whatsappController.listAutomacoes);
        protectedApp.post('/automacoes', whatsappController.createAutomacao);
        protectedApp.put('/automacoes/:id', whatsappController.updateAutomacao);
        protectedApp.delete('/automacoes/:id', whatsappController.deleteAutomacao);

        // Funis de disparo
        protectedApp.get('/funis', whatsappController.listFunis);
        protectedApp.post('/funis', whatsappController.createFunil);
        protectedApp.post('/funis/upload', whatsappController.uploadMidia);
        protectedApp.get('/funis/:id', whatsappController.getFunilById);
        protectedApp.put('/funis/:id', whatsappController.updateFunil);
        protectedApp.delete('/funis/:id', whatsappController.deleteFunil);

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

        // Criação de instância controlada (antes do proxy para ter precedência)
        protectedApp.post('/evolution/instance/create', whatsappController.createInstance);

        // Evolution API proxy — repassa qualquer método/path para a Evolution
        protectedApp.all('/evolution/*', whatsappController.evolutionProxy);
    });



}