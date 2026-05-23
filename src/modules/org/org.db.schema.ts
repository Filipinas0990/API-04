import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    email: varchar('email', { length: 200 }),
    phone: varchar('phone', { length: 20 }),
    logo_url: text('logo_url'),
    // ── Assinatura ────────────────────────────────────────────────────────────
    plano: text('plano').default('basic'),                   // 'basic' | 'premium' | 'gold'
    plano_status: text('plano_status').default('active'),    // 'active' | 'inactive'
    plano_expira_em: timestamp('plano_expira_em'),           // null = sem expiração
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const invites = pgTable('invites', {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 200 }).notNull(),
    token: text('token').notNull().unique(),
    status: text('status').default('pendente'), // 'pendente' | 'aceito' | 'cancelado'
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at').defaultNow(),
}, (table) => [
    index('invites_token_idx').on(table.token),
    index('invites_org_id_idx').on(table.organization_id),
]);
