import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../config/jwt';
import { db } from '../database/client';
import { users, organizations } from '../database/shema';
import { eq } from 'drizzle-orm';
import type { Plano } from '../config/plans';

declare module 'fastify' {
    interface FastifyRequest {
        user: {
            id: string;
            role: string;                  // 'owner' | 'agent'
            tipo_conta: string;            // 'corretor' | 'imobiliaria' | 'admin'
            organization_id: string | null;
            plano: Plano;
        };
    }
}

async function resolveEfectivePlan(userId: string, organizationId: string | null): Promise<Plano> {
    // Corretor dentro de uma imobiliaria herda o plano da organização
    if (organizationId) {
        const [org] = await db
            .select({ plano: organizations.plano, plano_status: organizations.plano_status, plano_expira_em: organizations.plano_expira_em })
            .from(organizations)
            .where(eq(organizations.id, organizationId))
            .limit(1);

        if (org && org.plano_status === 'active') {
            if (!org.plano_expira_em || org.plano_expira_em > new Date()) {
                return (org.plano ?? 'basic') as Plano;
            }
        }
        return 'basic';
    }

    // Corretor autônomo: usa o próprio plano
    const [user] = await db
        .select({ plano: users.plano, plano_status: users.plano_status, plano_expira_em: users.plano_expira_em })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (user && user.plano_status === 'active') {
        if (!user.plano_expira_em || user.plano_expira_em > new Date()) {
            return (user.plano ?? 'basic') as Plano;
        }
    }
    return 'basic';
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

    const tipo_conta = payload.tipo_conta ?? 'corretor';
    const organization_id = payload.organization_id ?? null;
    const plano = tipo_conta === 'admin'
        ? 'gold' as Plano
        : await resolveEfectivePlan(payload.sub, organization_id);

    req.user = {
        id: payload.sub,
        role: payload.role ?? 'owner',
        tipo_conta,
        organization_id,
        plano,
    };
}

// Garante que apenas admins (tipo_conta === 'admin') acessem o endpoint via JWT
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Token não fornecido' });
    }

    const payload = verifyAccessToken(authHeader.split(' ')[1]);

    if (!payload) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Token inválido ou expirado' });
    }

    if (payload.tipo_conta !== 'admin') {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Acesso exclusivo para administradores' });
    }

    req.user = {
        id: payload.sub,
        role: payload.role ?? 'owner',
        tipo_conta: 'admin',
        organization_id: null,
        plano: 'gold',
    };
}

// Garante que apenas imobiliárias (owner) acessem o endpoint
export async function requireImobiliaria(req: FastifyRequest, reply: FastifyReply) {
    if (req.user.tipo_conta !== 'imobiliaria' || req.user.role !== 'owner') {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Acesso exclusivo para imobiliárias' });
    }
}

// Protege endpoints de criação de conta com chave secreta de admin
export async function adminMiddleware(req: FastifyRequest, reply: FastifyReply) {
    const { env } = await import('../config/env');
    const key = req.headers['x-admin-key'];
    if (!key || key !== env.ADMIN_SECRET) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Chave de admin inválida' });
    }
}
