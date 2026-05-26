"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../database/client");
const auth_schema_1 = require("./auth.schema");
const publicUserFields = {
    id: auth_schema_1.users.id,
    name: auth_schema_1.users.name,
    email: auth_schema_1.users.email,
    phone: auth_schema_1.users.phone,
    creci: auth_schema_1.users.creci,
    avatar_url: auth_schema_1.users.avatar_url,
    role: auth_schema_1.users.role,
    tipo_conta: auth_schema_1.users.tipo_conta,
    organization_id: auth_schema_1.users.organization_id,
    created_at: auth_schema_1.users.created_at,
    updated_at: auth_schema_1.users.updated_at,
};
exports.authRepository = {
    async findByEmail(email) {
        const result = await client_1.db.select().from(auth_schema_1.users).where((0, drizzle_orm_1.eq)(auth_schema_1.users.email, email));
        return result[0] ?? null;
    },
    async findByPhone(phone) {
        const result = await client_1.db.select(publicUserFields).from(auth_schema_1.users).where((0, drizzle_orm_1.eq)(auth_schema_1.users.phone, phone));
        return result[0] ?? null;
    },
    async findAdmin() {
        const result = await client_1.db.select({ id: auth_schema_1.users.id }).from(auth_schema_1.users).where((0, drizzle_orm_1.eq)(auth_schema_1.users.tipo_conta, 'admin')).limit(1);
        return result[0] ?? null;
    },
    async findById(id) {
        const result = await client_1.db.select(publicUserFields).from(auth_schema_1.users).where((0, drizzle_orm_1.eq)(auth_schema_1.users.id, id));
        return result[0] ?? null;
    },
    async create(data) {
        const [user] = await client_1.db.insert(auth_schema_1.users).values(data).returning(publicUserFields);
        return user;
    },
    async update(id, data) {
        const [user] = await client_1.db
            .update(auth_schema_1.users)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(auth_schema_1.users.id, id))
            .returning(publicUserFields);
        return user;
    },
    async saveRefreshToken(userId, token, expiresAt) {
        await client_1.db.insert(auth_schema_1.refreshTokens).values({
            user_id: userId,
            token,
            expires_at: expiresAt,
        });
    },
    async findRefreshToken(token) {
        const result = await client_1.db.select().from(auth_schema_1.refreshTokens).where((0, drizzle_orm_1.eq)(auth_schema_1.refreshTokens.token, token));
        return result[0] ?? null;
    },
    async deleteRefreshToken(token) {
        await client_1.db.delete(auth_schema_1.refreshTokens).where((0, drizzle_orm_1.eq)(auth_schema_1.refreshTokens.token, token));
    },
    async deleteAllRefreshTokens(userId) {
        await client_1.db.delete(auth_schema_1.refreshTokens).where((0, drizzle_orm_1.eq)(auth_schema_1.refreshTokens.user_id, userId));
    },
    async updatePassword(id, hashedPassword) {
        await client_1.db.update(auth_schema_1.users)
            .set({ password: hashedPassword, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(auth_schema_1.users.id, id));
    },
};
//# sourceMappingURL=auth.repository.js.map