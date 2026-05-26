"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invites = exports.organizations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.organizations = (0, pg_core_1.pgTable)('organizations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 200 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 200 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    logo_url: (0, pg_core_1.text)('logo_url'),
    // ── Assinatura ────────────────────────────────────────────────────────────
    plano: (0, pg_core_1.text)('plano').default('basic'), // 'basic' | 'premium' | 'gold'
    plano_status: (0, pg_core_1.text)('plano_status').default('active'), // 'active' | 'inactive'
    plano_expira_em: (0, pg_core_1.timestamp)('plano_expira_em'), // null = sem expiração
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.invites = (0, pg_core_1.pgTable)('invites', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    organization_id: (0, pg_core_1.uuid)('organization_id').notNull().references(() => exports.organizations.id, { onDelete: 'cascade' }),
    email: (0, pg_core_1.varchar)('email', { length: 200 }).notNull(),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    status: (0, pg_core_1.text)('status').default('pendente'), // 'pendente' | 'aceito' | 'cancelado'
    expires_at: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('invites_token_idx').on(table.token),
    (0, pg_core_1.index)('invites_org_id_idx').on(table.organization_id),
]);
//# sourceMappingURL=org.db.schema.js.map