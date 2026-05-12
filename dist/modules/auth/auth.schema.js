"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokens = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const org_db_schema_1 = require("../org/org.db.schema");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 200 }).notNull().unique(),
    password: (0, pg_core_1.varchar)('password', { length: 300 }).notNull(),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    creci: (0, pg_core_1.varchar)('creci', { length: 50 }),
    avatar_url: (0, pg_core_1.text)('avatar_url'),
    // ── Plano / Org ───────────────────────────────────────────────────────────
    tipo_conta: (0, pg_core_1.text)('tipo_conta').default('corretor'), // 'corretor' | 'imobiliaria'
    role: (0, pg_core_1.text)('role').default('owner'), // 'owner' | 'agent'
    organization_id: (0, pg_core_1.uuid)('organization_id').references(() => org_db_schema_1.organizations.id, { onDelete: 'set null' }),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.refreshTokens = (0, pg_core_1.pgTable)('refresh_tokens', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    expires_at: (0, pg_core_1.timestamp)('expires_at').notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
//# sourceMappingURL=auth.schema.js.map