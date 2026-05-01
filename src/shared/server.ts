import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import { env } from '../config/env';
import { errorHandler } from '../middlewares/error.middleware';

export function buildApp() {
    const app = Fastify({
        logger:
            env.NODE_ENV !== 'test'
                ? {
                    transport: {
                        target: 'pino-pretty',
                        options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                    },
                }
                : false, // sem log em testes
    });

    // Plugins de segurança e utilitários
    app.register(helmet);
    app.register(cors, {
        origin: env.FRONTEND_URL,
        credentials: true,
    });
    app.register(cookie, {
        secret: env.REFRESH_SECRET, // assina os cookies
    });

    // Health check (sem autenticação)
    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV,
    }));

    // Handler global de erros
    app.setErrorHandler(errorHandler);

    // Rotas serão registradas aqui (Sprint 1 em diante)
    // app.register(authRoutes, { prefix: '/api/v1/auth' });
    // app.register(leadRoutes, { prefix: '/api/v1/leads' });

    return app;
}