import { FastifyInstance } from 'fastify';
import { whatsappController } from './whatsapp.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function campanhaRoutes(app: FastifyInstance) {
    app.register(async (protectedApp) => {
        protectedApp.addHook('preHandler', authMiddleware);

        protectedApp.get('/', whatsappController.listDisparos);
        protectedApp.post('/', whatsappController.iniciarCampanha);
        protectedApp.get('/:id/progresso', whatsappController.getProgresso);
        protectedApp.delete('/:id', whatsappController.cancelarCampanha);
    });
}
