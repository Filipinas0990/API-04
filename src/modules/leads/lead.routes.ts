import { FastifyInstance } from 'fastify';
import { leadController } from './lead.controller';
import { etiquetaController } from '../etiquetas/etiqueta.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function leadRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', leadController.list);
    app.post('/', leadController.create);
    app.get('/pipeline', leadController.getPipeline);
    app.get('/:id', leadController.getById);
    app.put('/:id', leadController.update);
    app.delete('/:id', leadController.remove);
    app.patch('/:id/status', leadController.updateStatus);
    app.post('/:id/etiquetas/:etiquetaId', etiquetaController.addToLead);
    app.delete('/:id/etiquetas/:etiquetaId', etiquetaController.removeFromLead);
}
