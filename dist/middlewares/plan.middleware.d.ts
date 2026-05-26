import { FastifyRequest, FastifyReply } from 'fastify';
import { type Feature } from '../config/plans';
export declare function requireFeature(feature: Feature): (req: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
//# sourceMappingURL=plan.middleware.d.ts.map