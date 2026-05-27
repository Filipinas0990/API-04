import { FastifyInstance } from 'fastify';
import { metaController } from './meta.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function metasRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', metaController.list);
    app.post('/', metaController.create);
    app.put('/:id', metaController.update);
    app.delete('/:id', metaController.remove);
}
