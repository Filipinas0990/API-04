"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAdmin = requireAdmin;
exports.requireImobiliaria = requireImobiliaria;
exports.adminMiddleware = adminMiddleware;
const jwt_1 = require("../config/jwt");
const client_1 = require("../database/client");
const shema_1 = require("../database/shema");
const drizzle_orm_1 = require("drizzle-orm");
async function resolveEfectivePlan(userId, organizationId) {
    // Corretor dentro de uma imobiliaria herda o plano da organização
    if (organizationId) {
        const [org] = await client_1.db
            .select({ plano: shema_1.organizations.plano, plano_status: shema_1.organizations.plano_status, plano_expira_em: shema_1.organizations.plano_expira_em })
            .from(shema_1.organizations)
            .where((0, drizzle_orm_1.eq)(shema_1.organizations.id, organizationId))
            .limit(1);
        if (org && org.plano_status === 'active') {
            if (!org.plano_expira_em || org.plano_expira_em > new Date()) {
                return (org.plano ?? 'basic');
            }
        }
        return 'basic';
    }
    // Corretor autônomo: usa o próprio plano
    const [user] = await client_1.db
        .select({ plano: shema_1.users.plano, plano_status: shema_1.users.plano_status, plano_expira_em: shema_1.users.plano_expira_em })
        .from(shema_1.users)
        .where((0, drizzle_orm_1.eq)(shema_1.users.id, userId))
        .limit(1);
    if (user && user.plano_status === 'active') {
        if (!user.plano_expira_em || user.plano_expira_em > new Date()) {
            return (user.plano ?? 'basic');
        }
    }
    return 'basic';
}
async function authMiddleware(req, reply) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Token não fornecido' });
    }
    const payload = (0, jwt_1.verifyAccessToken)(authHeader.split(' ')[1]);
    if (!payload) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Token inválido ou expirado' });
    }
    const tipo_conta = payload.tipo_conta ?? 'corretor';
    const organization_id = payload.organization_id ?? null;
    const plano = tipo_conta === 'admin'
        ? 'gold'
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
async function requireAdmin(req, reply) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Token não fornecido' });
    }
    const payload = (0, jwt_1.verifyAccessToken)(authHeader.split(' ')[1]);
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
async function requireImobiliaria(req, reply) {
    if (req.user.tipo_conta !== 'imobiliaria' || req.user.role !== 'owner') {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Acesso exclusivo para imobiliárias' });
    }
}
// Protege endpoints de criação de conta com chave secreta de admin
async function adminMiddleware(req, reply) {
    const { env } = await Promise.resolve().then(() => __importStar(require('../config/env')));
    const key = req.headers['x-admin-key'];
    if (!key || key !== env.ADMIN_SECRET) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Chave de admin inválida' });
    }
}
//# sourceMappingURL=auth.middleware.js.map