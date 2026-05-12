import { FastifyRequest, FastifyReply } from 'fastify';
declare module 'fastify' {
    interface FastifyRequest {
        user: {
            id: string;
            role: string;
            tipo_conta: string;
            organization_id: string | null;
        };
    }
}
export declare function authMiddleware(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function requireImobiliaria(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
export declare function adminMiddleware(req: FastifyRequest, reply: FastifyReply): Promise<undefined>;
//# sourceMappingURL=auth.middleware.d.ts.map