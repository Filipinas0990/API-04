import { FastifyInstance } from 'fastify';
import { whatsappController } from './whatsapp.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function whatsappRoutes(app: FastifyInstance) {
    // Webhook público — sem autenticação (Evolution API chama diretamente)
    app.post('/webhook', whatsappController.webhook);

    // Rotas protegidas
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

        // Automações
        protectedApp.get('/automacoes', whatsappController.listAutomacoes);
        protectedApp.post('/automacoes', whatsappController.createAutomacao);
        protectedApp.put('/automacoes/:id', whatsappController.updateAutomacao);
        protectedApp.delete('/automacoes/:id', whatsappController.deleteAutomacao);
    });
}