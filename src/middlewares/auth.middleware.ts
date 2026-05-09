import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../config/jwt';

declare module 'fastify' {
    interface FastifyRequest {
        user: {
            id: string;
            role: string;                  // 'owner' | 'agent'
            tipo_conta: string;            // 'corretor' | 'imobiliaria'
            organization_id: string | null;
        };
    }
}

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Token não fornecido' });
    }

    const payload = verifyAccessToken(authHeader.split(' ')[1]);

    if (!payload) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Token inválido ou expirado' });
    }

    req.user = {
        id: payload.sub,
        role: payload.role ?? 'owner',
        tipo_conta: payload.tipo_conta ?? 'corretor',
        organization_id: payload.organization_id ?? null,
    };
}

// Garante que apenas imobiliárias (owner) acessem o endpoint
export async function requireImobiliaria(req: FastifyRequest, reply: FastifyReply) {
    if (req.user.tipo_conta !== 'imobiliaria' || req.user.role !== 'owner') {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Acesso exclusivo para imobiliárias' });
    }
}