import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authRepository } from './auth.repository';
import { orgRepository } from '../org/org.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../config/jwt';


const registerSchema = z.object({
    name: z.string().min(2, 'Nome muito curto'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    phone: z.string().optional(),
    creci: z.string().optional(),
    organization_id: z.string().uuid('organization_id inválido').optional(),
});

const registerImobiliariaSchema = z.object({
    name: z.string().min(2, 'Nome muito curto'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    phone: z.string().optional(),
    org_name: z.string().min(2, 'Nome da imobiliária muito curto'),
    org_phone: z.string().optional(),
    org_email: z.string().email().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const updateSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    creci: z.string().optional(),
});


function refreshExpiresAt(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
}

export const authController = {
    async register(req: FastifyRequest, reply: FastifyReply) {
        const data = registerSchema.parse(req.body);

        const existing = await authRepository.findByEmail(data.email);
        if (existing) {
            return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Email já cadastrado' });
        }

        // Se vier organization_id, valida que a org existe e vincula como agent
        if (data.organization_id) {
            const org = await orgRepository.findOrgById(data.organization_id);
            if (!org) {
                return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Imobiliária não encontrada' });
            }
        }

        const user = await authRepository.create({
            ...data,
            password: await bcrypt.hash(data.password, 12),
            tipo_conta: 'corretor',
            role: data.organization_id ? 'agent' : 'owner',
        });

        return reply.status(201).send(user);
    },

    async registerImobiliaria(req: FastifyRequest, reply: FastifyReply) {
        const data = registerImobiliariaSchema.parse(req.body);

        const existing = await authRepository.findByEmail(data.email);
        if (existing) {
            return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Email já cadastrado' });
        }

        // 1. Cria a organização
        const org = await orgRepository.createOrg({
            name: data.org_name,
            email: data.org_email,
            phone: data.org_phone,
        });

        // 2. Cria o usuário vinculado à org como owner
        const user = await authRepository.create({
            name: data.name,
            email: data.email,
            password: await bcrypt.hash(data.password, 12),
            phone: data.phone,
            tipo_conta: 'imobiliaria',
            role: 'owner',
            organization_id: org.id,
        });

        const accessToken = signAccessToken(user.id, {
            role: user.role ?? 'owner',
            tipo_conta: user.tipo_conta ?? 'imobiliaria',
            organization_id: user.organization_id ?? null,
        });
        const refreshToken = signRefreshToken(user.id);
        await authRepository.saveRefreshToken(user.id, refreshToken, refreshExpiresAt());

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

    async login(req: FastifyRequest, reply: FastifyReply) {
        const { email, password } = loginSchema.parse(req.body);

        const user = await authRepository.findByEmail(email);

        if (!user) {
            return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Email ou senha inválidos' });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Email ou senha inválidos' });
        }

        const accessToken = signAccessToken(user.id, {
            role: user.role ?? 'owner',
            tipo_conta: user.tipo_conta ?? 'corretor',
            organization_id: user.organization_id ?? null,
        });
        const refreshToken = signRefreshToken(user.id);


        await authRepository.saveRefreshToken(
            user.id,
            refreshToken,
            refreshExpiresAt()
        );


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

    async refresh(req: FastifyRequest, reply: FastifyReply) {
        const token = req.cookies?.refresh_token;

        if (!token) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Refresh token não fornecido',
            });
        }


        const payload = verifyRefreshToken(token);
        if (!payload) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Refresh token inválido ou expirado',
            });
        }


        const storedToken = await authRepository.findRefreshToken(token);
        if (!storedToken) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Refresh token revogado',
            });
        }


        await authRepository.deleteRefreshToken(token);
        const newRefreshToken = signRefreshToken(payload.sub);
        await authRepository.saveRefreshToken(
            payload.sub,
            newRefreshToken,
            refreshExpiresAt()
        );

        reply.setCookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth/refresh',
            maxAge: 60 * 60 * 24 * 7,
        });

        return reply.send({
            access_token: signAccessToken(payload.sub),
        });
    },

    async logout(req: FastifyRequest, reply: FastifyReply) {
        const token = req.cookies?.refresh_token;

        if (token) {
            await authRepository.deleteRefreshToken(token);
            reply.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
        }

        return reply.send({ message: 'Logout realizado com sucesso' });
    },

    async me(req: FastifyRequest, reply: FastifyReply) {
        const user = await authRepository.findById(req.user.id);

        if (!user) {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'Usuário não encontrado',
            });
        }

        return reply.send(user);
    },

    async updateMe(req: FastifyRequest, reply: FastifyReply) {
        const data = updateSchema.parse(req.body);
        const user = await authRepository.update(req.user.id, data);
        return reply.send(user);
    },

    async registerAdmin(req: FastifyRequest, reply: FastifyReply) {
        const data = z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(8),
        }).parse(req.body);

        const adminExistente = await authRepository.findAdmin();
        if (adminExistente) {
            return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Já existe um administrador cadastrado no sistema.' });
        }

        const existing = await authRepository.findByEmail(data.email);
        if (existing) {
            return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Email já cadastrado' });
        }

        const user = await authRepository.create({
            name: data.name,
            email: data.email,
            password: await bcrypt.hash(data.password, 12),
            tipo_conta: 'admin',
            role: 'owner',
            organization_id: undefined,
        });

        return reply.status(201).send({
            message: 'Conta admin criada com sucesso.',
            user: { id: user.id, name: user.name, email: user.email, tipo_conta: user.tipo_conta },
        });
    },

    async getAssistenteConfig(req: FastifyRequest, reply: FastifyReply) {
        const { env } = await import('../../config/env');
        const user = await authRepository.findById(req.user.id);
        return reply.send({
            filipe_phone: env.FILIPE_PHONE ?? null,
            meu_phone: user?.phone ?? null,
            configurado: !!user?.phone,
        });
    },

    async resetPassword(req: FastifyRequest, reply: FastifyReply) {
        const { email, new_password } = z.object({
            email: z.string().email(),
            new_password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
        }).parse(req.body);

        const user = await authRepository.findByEmail(email);
        if (!user) return reply.status(404).send({ message: 'Usuário não encontrado' });

        const hashed = await bcrypt.hash(new_password, 12);
        await authRepository.updatePassword(user.id, hashed);
        await authRepository.deleteAllRefreshTokens(user.id);

        return reply.send({ message: 'Senha redefinida com sucesso' });
    },
};