import { FastifyInstance } from 'fastify';
import { fluxoController } from './fluxo.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function fluxoRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', fluxoController.list);
    app.post('/', fluxoController.create);
    app.get('/saldo', fluxoController.getSaldo);
    app.get('/:id', fluxoController.getById);
    app.put('/:id', fluxoController.update);
    app.delete('/:id', fluxoController.remove);
}