import { FastifyInstance } from 'fastify';
import { imovelController } from './imovel.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function imovelRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', imovelController.list);
    app.post('/', imovelController.create);
    app.get('/:id', imovelController.getById);
    app.put('/:id', imovelController.update);
    app.delete('/:id', imovelController.remove);
}