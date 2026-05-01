import { FastifyInstance } from 'fastify';
import { tarefaController } from './tarefa.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function tarefaRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', tarefaController.list);
    app.post('/', tarefaController.create);
    app.get('/:id', tarefaController.getById);
    app.put('/:id', tarefaController.update);
    app.delete('/:id', tarefaController.remove);
    app.patch('/:id/concluir', tarefaController.concluir);
    app.patch('/:id/status', tarefaController.updateStatus);
}