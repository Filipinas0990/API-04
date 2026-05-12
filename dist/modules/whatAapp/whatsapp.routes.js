"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappRoutes = whatsappRoutes;
const whatsapp_controller_1 = require("./whatsapp.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function whatsappRoutes(app) {
    // Webhook público
    app.post('/webhook', whatsapp_controller_1.whatsappController.webhook);
    app.register(async (protectedApp) => {
        protectedApp.addHook('preHandler', auth_middleware_1.authMiddleware);
        // Status
        protectedApp.get('/status', whatsapp_controller_1.whatsappController.getStatus);
        // Conversas
        protectedApp.get('/conversas', whatsapp_controller_1.whatsappController.listConversas);
        protectedApp.patch('/conversas/:id', whatsapp_controller_1.whatsappController.updateConversa);
        // Mensagens
        protectedApp.get('/conversas/:conversaId/mensagens', whatsapp_controller_1.whatsappController.listMensagens);
        protectedApp.post('/send', whatsapp_controller_1.whatsappController.sendMensagem);
        // Assistente IA
        protectedApp.post('/assistente', whatsapp_controller_1.whatsappController.assistente);
        // Disparos
        protectedApp.get('/disparos', whatsapp_controller_1.whatsappController.listDisparos);
        protectedApp.post('/disparos', whatsapp_controller_1.whatsappController.iniciarDisparo);
        protectedApp.get('/disparos/limite', whatsapp_controller_1.whatsappController.getLimiteDiario);
        protectedApp.get('/disparos/logs', whatsapp_controller_1.whatsappController.listDisparoLogs);
        // Automações (legado)
        protectedApp.get('/automacoes', whatsapp_controller_1.whatsappController.listAutomacoes);
        protectedApp.post('/automacoes', whatsapp_controller_1.whatsappController.createAutomacao);
        protectedApp.put('/automacoes/:id', whatsapp_controller_1.whatsappController.updateAutomacao);
        protectedApp.delete('/automacoes/:id', whatsapp_controller_1.whatsappController.deleteAutomacao);
        // Automation Flows
        protectedApp.get('/flows', whatsapp_controller_1.whatsappController.listFlows);
        protectedApp.post('/flows', whatsapp_controller_1.whatsappController.createFlow);
        protectedApp.get('/flows/:id', whatsapp_controller_1.whatsappController.getFlowById);
        protectedApp.put('/flows/:id', whatsapp_controller_1.whatsappController.updateFlow);
        protectedApp.delete('/flows/:id', whatsapp_controller_1.whatsappController.deleteFlow);
        // Automation Nodes
        protectedApp.get('/flows/:flowId/nodes', whatsapp_controller_1.whatsappController.listNodes);
        protectedApp.post('/flows/:flowId/nodes', whatsapp_controller_1.whatsappController.createNode);
        protectedApp.put('/nodes/:id', whatsapp_controller_1.whatsappController.updateNode);
        protectedApp.delete('/nodes/:id', whatsapp_controller_1.whatsappController.deleteNode);
        // Evolution API proxy — repassa qualquer método/path para a Evolution
        protectedApp.all('/evolution/*', whatsapp_controller_1.whatsappController.evolutionProxy);
    });
}
//# sourceMappingURL=whatsapp.routes.js.map