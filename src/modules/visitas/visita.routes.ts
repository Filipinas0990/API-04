import { FastifyInstance } from 'fastify';
import { visitaController } from './visita.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function visitaRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', visitaController.list);
    app.post('/', visitaController.create);
    app.get('/:id', visitaController.getById);
    app.put('/:id', visitaController.update);
    app.delete('/:id', visitaController.remove);
    app.patch('/:id/status', visitaController.updateStatus);
}