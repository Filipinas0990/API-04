"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const env_1 = require("../config/env");
const error_middleware_1 = require("../middlewares/error.middleware");
const auth_routes_1 = require("../modules/auth/auth.routes");
const lead_routes_1 = require("../modules/leads/lead.routes");
const imovel_routes_1 = require("../modules/imoveis/imovel.routes");
const venda_routes_1 = require("../modules/vendas/venda.routes");
const tarefa_routes_1 = require("../modules/tarefas/tarefa.routes");
const visita_routes_1 = require("../modules/visitas/visita.routes");
const fluxo_routes_1 = require("../modules/fluxo-caixa/fluxo.routes");
const whatsapp_routes_1 = require("../modules/whatAapp/whatsapp.routes");
const org_routes_1 = require("../modules/org/org.routes");
const admin_routes_1 = require("../modules/admin/admin.routes");
const subscription_routes_1 = require("../modules/subscription/subscription.routes");
function buildApp() {
    const app = (0, fastify_1.default)({
        logger: env_1.env.NODE_ENV !== 'test'
            ? {
                transport: {
                    target: 'pino-pretty',
                    options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                },
            }
            : false,
    });
    app.register(helmet_1.default);
    app.register(multipart_1.default, { limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB
    app.register(cookie_1.default, { secret: env_1.env.REFRESH_SECRET });
    app.register(lead_routes_1.leadRoutes, { prefix: '/api/v1/leads' });
    app.register(imovel_routes_1.imovelRoutes, { prefix: '/api/v1/imoveis' });
    app.register(venda_routes_1.vendaRoutes, { prefix: '/api/v1/vendas' });
    app.register(tarefa_routes_1.tarefaRoutes, { prefix: '/api/v1/tarefas' });
    app.register(visita_routes_1.visitaRoutes, { prefix: '/api/v1/visitas' });
    app.register(fluxo_routes_1.fluxoRoutes, { prefix: '/api/v1/fluxo-caixa' });
    app.register(whatsapp_routes_1.whatsappRoutes, { prefix: '/api/v1/whatsapp' });
    app.register(org_routes_1.orgRoutes, { prefix: '/api/v1/org' });
    app.register(admin_routes_1.adminRoutes, { prefix: '/api/v1/admin' });
    app.register(subscription_routes_1.subscriptionRoutes, { prefix: '/api/v1' });
    app.register(cors_1.default, {
        origin: env_1.env.FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env_1.env.NODE_ENV,
    }));
    app.register(auth_routes_1.authRoutes, { prefix: '/api/v1/auth' });
    app.setErrorHandler(error_middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=server.js.map