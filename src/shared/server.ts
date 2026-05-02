import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import { env } from '../config/env';
import { errorHandler } from '../middlewares/error.middleware';
import { authRoutes } from '../modules/auth/auth.routes';
import { leadRoutes } from '../modules/leads/lead.routes';
import { imovelRoutes } from '../modules/imoveis/imovel.routes';
import { vendaRoutes } from '../modules/vendas/venda.routes';
import { tarefaRoutes } from '../modules/tarefas/tarefa.routes';
import { visitaRoutes } from '../modules/visitas/visita.routes';
import { fluxoRoutes } from '../modules/fluxo-caixa/fluxo.routes';




export function buildApp() {
    const app = Fastify({
        logger: env.NODE_ENV !== 'test'
            ? {
                transport: {
                    target: 'pino-pretty',
                    options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                },
            }
            : false,
    });

    app.register(helmet);
    app.register(cors, { origin: env.FRONTEND_URL, credentials: true });
    app.register(cookie, { secret: env.REFRESH_SECRET });
    app.register(leadRoutes, { prefix: '/api/v1/leads' });
    app.register(imovelRoutes, { prefix: '/api/v1/imoveis' });
    app.register(vendaRoutes, { prefix: '/api/v1/vendas' });
    app.register(tarefaRoutes, { prefix: '/api/v1/tarefas' });
    app.register(visitaRoutes, { prefix: '/api/v1/visitas' });
    app.register(fluxoRoutes, { prefix: '/api/v1/fluxo-caixa' });



    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV,
    }));


    app.register(authRoutes, { prefix: '/api/v1/auth' });

    app.setErrorHandler(errorHandler);

    return app;
}