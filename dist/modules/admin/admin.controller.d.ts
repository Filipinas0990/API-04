import { FastifyRequest, FastifyReply } from 'fastify';
export declare const adminController: {
    listClientes(req: FastifyRequest, reply: FastifyReply): Promise<never>;
    listCorretores(req: FastifyRequest, reply: FastifyReply): Promise<never>;
    listImobiliarias(req: FastifyRequest, reply: FastifyReply): Promise<never>;
    setUserPlan(req: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    setOrgPlan(req: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    deactivateUserPlan(req: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
    deactivateOrgPlan(req: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply): Promise<never>;
};
//# sourceMappingURL=admin.controller.d.ts.map