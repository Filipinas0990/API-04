import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import { env } from '../config/env';
import { errorHandler } from '../middlewares/error.middleware';
import { authRoutes } from '../modules/auth/auth.routes';
import { leadRoutes } from '../modules/leads/lead.routes';


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


    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV,
    }));


    app.register(authRoutes, { prefix: '/api/v1/auth' });

    app.setErrorHandler(errorHandler);

    return app;
}