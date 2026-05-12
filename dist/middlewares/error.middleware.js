"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(error, request, reply) {
    request.log.error(error);
    // Erros de validação do Zod
    if (error instanceof zod_1.ZodError) {
        return reply.status(400).send({
            statusCode: 400,
            error: 'Validation Error',
            issues: error.flatten().fieldErrors,
        });
    }
    // Erros do Fastify (ex: schema validation)
    if ('statusCode' in error && error.statusCode) {
        return reply.status(error.statusCode).send({
            statusCode: error.statusCode,
            error: error.name,
            message: error.message,
        });
    }
    // Erro genérico (nunca expõe detalhes em produção)
    return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'Algo deu errado.'
            : error.message,
    });
}
//# sourceMappingURL=error.middleware.js.map