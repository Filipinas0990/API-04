import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../config/jwt';

// Extende o tipo do FastifyRequest para incluir o user
declare module 'fastify' {
    interface FastifyRequest {
        user: { id: string };
    }
}

export async function authMiddleware(
    req: FastifyRequest,
    reply: FastifyReply
) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Token não fornecido',
        });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
        return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Token inválido ou expirado',
        });
    }

    req.user = { id: payload.sub };
}