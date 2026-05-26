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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const auth_repository_1 = require("./auth.repository");
const org_repository_1 = require("../org/org.repository");
const jwt_1 = require("../../config/jwt");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nome muito curto'),
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    phone: zod_1.z.string().optional(),
    creci: zod_1.z.string().optional(),
    organization_id: zod_1.z.string().uuid('organization_id inválido').optional(),
});
const registerImobiliariaSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nome muito curto'),
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    phone: zod_1.z.string().optional(),
    org_name: zod_1.z.string().min(2, 'Nome da imobiliária muito curto'),
    org_phone: zod_1.z.string().optional(),
    org_email: zod_1.z.string().email().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
    creci: zod_1.z.string().optional(),
});
function refreshExpiresAt() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
}
exports.authController = {
    async register(req, reply) {
        const data = registerSchema.parse(req.body);
        const existing = await auth_repository_1.authRepository.findByEmail(data.email);
        if (existing) {
            return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Email já cadastrado' });
        }
        // Se vier organization_id, valida que a org existe e vincula como agent
        if (data.organization_id) {
            const org = await org_repository_1.orgRepository.findOrgById(data.organization_id);
            if (!org) {
                return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Imobiliária não encontrada' });
            }
        }
        const user = await auth_repository_1.authRepository.create({
            ...data,
            password: await bcryptjs_1.default.hash(data.password, 12),
            tipo_conta: 'corretor',
            role: data.organization_id ? 'agent' : 'owner',
        });
        return reply.status(201).send(user);
    },
    async registerImobiliaria(req, reply) {
        const data = registerImobiliariaSchema.parse(req.body);
        const existing = await auth_repository_1.authRepository.findByEmail(data.email);
        if (existing) {
            return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Email já cadastrado' });
        }
        // 1. Cria a organização
        const org = await org_repository_1.orgRepository.createOrg({
            name: data.org_name,
            email: data.org_email,
            phone: data.org_phone,
        });
        // 2. Cria o usuário vinculado à org como owner
        const user = await auth_repository_1.authRepository.create({
            name: data.name,
            email: data.email,
            password: await bcryptjs_1.default.hash(data.password, 12),
            phone: data.phone,
            tipo_conta: 'imobiliaria',
            role: 'owner',
            organization_id: org.id,
        });
        const accessToken = (0, jwt_1.signAccessToken)(user.id, {
            role: user.role ?? 'owner',
            tipo_conta: user.tipo_conta ?? 'imobiliaria',
            organization_id: user.organization_id ?? null,
        });
        const refreshToken = (0, jwt_1.signRefreshToken)(user.id);
        await auth_repository_1.authRepository.saveRefreshToken(user.id, refreshToken, refreshExpiresAt());
        reply.setCookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth/refresh',
            maxAge: 60 * 60 * 24 * 7,
        });
        return reply.status(201).send({
            access_token: accessToken,
            user: { id: user.id, name: user.name, email: user.email, tipo_conta: user.tipo_conta, role: user.role, organization_id: user.organization_id },
            organization: org,
        });
    },
    async login(req, reply) {
        const { email, password } = loginSchema.parse(req.body);
        const user = await auth_repository_1.authRepository.findByEmail(email);
        if (!user) {
            return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Email ou senha inválidos' });
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Email ou senha inválidos' });
        }
        const accessToken = (0, jwt_1.signAccessToken)(user.id, {
            role: user.role ?? 'owner',
            tipo_conta: user.tipo_conta ?? 'corretor',
            organization_id: user.organization_id ?? null,
        });
        const refreshToken = (0, jwt_1.signRefreshToken)(user.id);
        await auth_repository_1.authRepository.saveRefreshToken(user.id, refreshToken, refreshExpiresAt());
        reply.setCookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth/refresh',
            maxAge: 60 * 60 * 24 * 7,
        });
        return reply.send({
            access_token: accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                tipo_conta: user.tipo_conta ?? 'corretor',
                role: user.role ?? 'owner',
                organization_id: user.organization_id ?? null,
            },
        });
    },
    async refresh(req, reply) {
        const token = req.cookies?.refresh_token;
        if (!token) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Refresh token não fornecido',
            });
        }
        const payload = (0, jwt_1.verifyRefreshToken)(token);
        if (!payload) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Refresh token inválido ou expirado',
            });
        }
        const storedToken = await auth_repository_1.authRepository.findRefreshToken(token);
        if (!storedToken) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Refresh token revogado',
            });
        }
        await auth_repository_1.authRepository.deleteRefreshToken(token);
        const newRefreshToken = (0, jwt_1.signRefreshToken)(payload.sub);
        await auth_repository_1.authRepository.saveRefreshToken(payload.sub, newRefreshToken, refreshExpiresAt());
        reply.setCookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth/refresh',
            maxAge: 60 * 60 * 24 * 7,
        });
        return reply.send({
            access_token: (0, jwt_1.signAccessToken)(payload.sub),
        });
    },
    async logout(req, reply) {
        const token = req.cookies?.refresh_token;
        if (token) {
            await auth_repository_1.authRepository.deleteRefreshToken(token);
            reply.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
        }
        return reply.send({ message: 'Logout realizado com sucesso' });
    },
    async me(req, reply) {
        const user = await auth_repository_1.authRepository.findById(req.user.id);
        if (!user) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Usuário não encontrado',
            });
        }
        return reply.send(user);
    },
    async updateMe(req, reply) {
        const data = updateSchema.parse(req.body);
        const user = await auth_repository_1.authRepository.update(req.user.id, data);
        return reply.send(user);
    },
    async registerAdmin(req, reply) {
        const data = zod_1.z.object({
            name: zod_1.z.string().min(2),
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(8),
        }).parse(req.body);
        const adminExistente = await auth_repository_1.authRepository.findAdmin();
        if (adminExistente) {
            return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Já existe um administrador cadastrado no sistema.' });
        }
        const existing = await auth_repository_1.authRepository.findByEmail(data.email);
        if (existing) {
            return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Email já cadastrado' });
        }
        const user = await auth_repository_1.authRepository.create({
            name: data.name,
            email: data.email,
            password: await bcryptjs_1.default.hash(data.password, 12),
            tipo_conta: 'admin',
            role: 'owner',
            organization_id: undefined,
        });
        return reply.status(201).send({
            message: 'Conta admin criada com sucesso.',
            user: { id: user.id, name: user.name, email: user.email, tipo_conta: user.tipo_conta },
        });
    },
    async getAssistenteConfig(req, reply) {
        const { env } = await Promise.resolve().then(() => __importStar(require('../../config/env')));
        const user = await auth_repository_1.authRepository.findById(req.user.id);
        return reply.send({
            filipe_phone: env.FILIPE_PHONE ?? null,
            meu_phone: user?.phone ?? null,
            configurado: !!user?.phone,
        });
    },
    async resetPassword(req, reply) {
        const { email, new_password } = zod_1.z.object({
            email: zod_1.z.string().email(),
            new_password: zod_1.z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
        }).parse(req.body);
        const user = await auth_repository_1.authRepository.findByEmail(email);
        if (!user)
            return reply.status(404).send({ message: 'Usuário não encontrado' });
        const hashed = await bcryptjs_1.default.hash(new_password, 12);
        await auth_repository_1.authRepository.updatePassword(user.id, hashed);
        await auth_repository_1.authRepository.deleteAllRefreshTokens(user.id);
        return reply.send({ message: 'Senha redefinida com sucesso' });
    },
};
//# sourceMappingURL=auth.controller.js.map