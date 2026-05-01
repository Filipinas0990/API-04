import { FastifyInstance } from 'fastify';
import { vendaController } from './venda.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function vendaRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', vendaController.list);
    app.post('/', vendaController.create);
    app.get('/resumo', vendaController.getResumo);
    app.get('/:id', vendaController.getById);
    app.put('/:id', vendaController.update);
    app.delete('/:id', vendaController.remove);
    app.patch('/:id/status', vendaController.updateStatus);
}