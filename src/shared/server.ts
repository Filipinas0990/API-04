import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config/env';
import { getRedisClient } from '../config/redis';
import { errorHandler } from '../middlewares/error.middleware';
import { registerRequestLogger } from '../middlewares/logger.middleware';
import { authRoutes } from '../modules/auth/auth.routes';
import { leadRoutes } from '../modules/leads/lead.routes';
import { imovelRoutes } from '../modules/imoveis/imovel.routes';
import { vendaRoutes } from '../modules/vendas/venda.routes';
import { tarefaRoutes } from '../modules/tarefas/tarefa.routes';
import { visitaRoutes } from '../modules/visitas/visita.routes';
import { fluxoRoutes } from '../modules/fluxo-caixa/fluxo.routes';
import { whatsappRoutes } from '../modules/whatAapp/whatsapp.routes';
import { orgRoutes } from '../modules/org/org.routes';
import { adminRoutes } from '../modules/admin/admin.routes';
import { subscriptionRoutes } from '../modules/subscription/subscription.routes';
import { etiquetasRoutes } from '../modules/etiquetas/etiqueta.routes';
import { metasRoutes } from '../modules/metas/meta.routes';




export function buildApp() {
    const app = Fastify({
        disableRequestLogging: true,
        logger: env.NODE_ENV !== 'test'
            ? {
                level: 'info',
                transport: {
                    target: 'pino-pretty',
                    options: {
                        translateTime: 'HH:MM:ss Z',
                        ignore: 'pid,hostname',
                        colorize: true,
                    },
                },
            }
            : false,
    });

    app.register(helmet);
    app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

    const redis = getRedisClient();
    app.register(rateLimit, {
        global: true,
        max: 200,
        timeWindow: '1 minute',
        ...(redis ? { redis } : {}),
        keyGenerator: (request) => request.ip,
        errorResponseBuilder: (_request, context) => ({
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Limite de requisições atingido. Aguarde ${Math.ceil(context.ttl / 1000)} segundo(s).`,
        }),
    });

    app.register(cookie, { secret: env.REFRESH_SECRET });
    app.register(leadRoutes, { prefix: '/api/v1/leads' });
    app.register(imovelRoutes, { prefix: '/api/v1/imoveis' });
    app.register(vendaRoutes, { prefix: '/api/v1/vendas' });
    app.register(tarefaRoutes, { prefix: '/api/v1/tarefas' });
    app.register(visitaRoutes, { prefix: '/api/v1/visitas' });
    app.register(fluxoRoutes, { prefix: '/api/v1/fluxo-caixa' });
    app.register(whatsappRoutes, { prefix: '/api/v1/whatsapp' });
    app.register(orgRoutes, { prefix: '/api/v1/org' });
    app.register(adminRoutes, { prefix: '/api/v1/admin' });
    app.register(subscriptionRoutes, { prefix: '/api/v1' });
    app.register(etiquetasRoutes, { prefix: '/api/v1/etiquetas' });
    app.register(metasRoutes, { prefix: '/api/v1/metas' });



    app.register(cors, {
        origin: env.FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV,
    }));


    app.register(authRoutes, { prefix: '/api/v1/auth' });

    registerRequestLogger(app);
    app.setErrorHandler(errorHandler);

    return app;
}