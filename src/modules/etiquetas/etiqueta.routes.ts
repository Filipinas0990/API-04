import { FastifyInstance } from 'fastify';
import { etiquetaController } from './etiqueta.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function etiquetasRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', etiquetaController.list);
    app.post('/', etiquetaController.create);
    app.get('/stats', etiquetaController.getStats);
    app.put('/:id', etiquetaController.update);
    app.delete('/:id', etiquetaController.remove);
}
