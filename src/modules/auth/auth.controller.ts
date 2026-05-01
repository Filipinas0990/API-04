import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authRepository } from './auth.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../config/jwt';


const registerSchema = z.object({
    name: z.string().min(2, 'Nome muito curto'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    phone: z.string().optional(),
    creci: z.string().optional(),
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
            return reply.status(409).send({
                statusCode: 409,
                error: 'Conflict',
                message: 'Email já cadastrado',
            });
        }


        const hashedPassword = await bcrypt.hash(data.password, 12);

        const user = await authRepository.create({
            ...data,
            password: hashedPassword,
        });

        return reply.status(201).send(user);
    },

    async login(req: FastifyRequest, reply: FastifyReply) {
        const { email, password } = loginSchema.parse(req.body);

        const user = await authRepository.findByEmail(email);
        if (!user) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Email ou senha inválidos',
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return reply.status(401).send({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Email ou senha inválidos',
            });
        }

        const accessToken = signAccessToken(user.id);
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
};