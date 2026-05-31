import { FastifyInstance } from 'fastify';

const METHOD_LABEL: Record<string, string> = {
    GET:     '🔍 GET   ',
    POST:    '✏️  POST  ',
    PUT:     '📝 PUT   ',
    PATCH:   '🔧 PATCH ',
    DELETE:  '🗑️  DELETE',
    OPTIONS: '⚙️  OPTIONS',
    HEAD:    '📌 HEAD  ',
};

export function registerRequestLogger(app: FastifyInstance) {
    app.addHook('onResponse', (request, reply, done) => {
        // Ignora health check para não poluir os logs
        if (request.url === '/health') return done();

        const status  = reply.statusCode;
        const method  = METHOD_LABEL[request.method] ?? request.method;
        const url     = request.url;
        const ip      = request.ip;
        const ms      = reply.elapsedTime.toFixed(1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId  = (request as any).user?.id ?? 'anon';

        const msg = `${method} ${url} → ${status} | ${ms}ms | IP:${ip} | user:${userId}`;

        if (status >= 500)      request.log.error(msg);
        else if (status >= 400) request.log.warn(msg);
        else                    request.log.info(msg);

        done();
    });
}
