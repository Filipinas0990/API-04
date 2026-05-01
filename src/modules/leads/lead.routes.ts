import { FastifyInstance } from 'fastify';
import { leadController } from './lead.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function leadRoutes(app: FastifyInstance) {
    // Todas as rotas de leads são protegidas
    app.addHook('preHandler', authMiddleware);

    app.get('/', leadController.list);
    app.post('/', leadController.create);
    app.get('/pipeline', leadController.getPipeline);
    app.get('/:id', leadController.getById);
    app.put('/:id', leadController.update);
    app.delete('/:id', leadController.remove);
    app.patch('/:id/status', leadController.updateStatus);
}