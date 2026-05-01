import { eq } from 'drizzle-orm';
import { db } from '../../database/client';
import { users, refreshTokens } from './auth.schema';

export const authRepository = {
    async findByEmail(email: string) {
        const result = await db.select().from(users).where(eq(users.email, email));
        return result[0] ?? null;
    },

    async findById(id: string) {
        const result = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            creci: users.creci,
            avatar_url: users.avatar_url,
            created_at: users.created_at,
            updated_at: users.updated_at,
        }).from(users).where(eq(users.id, id));
        return result[0] ?? null;
    },

    async create(data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        creci?: string;
    }) {
        const [user] = await db.insert(users).values(data).returning({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            creci: users.creci,
            created_at: users.created_at,
        });
        return user;
    },

    async update(id: string, data: {
        name?: string;
        phone?: string;
        creci?: string;
        avatar_url?: string;
    }) {
        const [user] = await db
            .update(users)
            .set({ ...data, updated_at: new Date() })
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                creci: users.creci,
                avatar_url: users.avatar_url,
                updated_at: users.updated_at,
            });
        return user;
    },

    async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
        await db.insert(refreshTokens).values({
            user_id: userId,
            token,
            expires_at: expiresAt,
        });
    },

    async findRefreshToken(token: string) {
        const result = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
        return result[0] ?? null;
    },

    async deleteRefreshToken(token: string) {
        await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
    },

    async deleteAllRefreshTokens(userId: string) {
        await db.delete(refreshTokens).where(eq(refreshTokens.user_id, userId));
    },
};