import { FastifyRequest, FastifyReply } from 'fastify';
import type { Plano } from '../config/plans';
declare module 'fastify' {
    interface FastifyRequest {
        user: {
            id: string;
            role: string;
            tipo_conta: string;
            organization_id: string | null;
            plano: Plano;
        };
    }
}
export declare function authMiddleware(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function requireImobiliaria(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function adminMiddleware(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
//# sourceMappingURL=auth.middleware.d.ts.map