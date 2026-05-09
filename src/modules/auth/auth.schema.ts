import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from '../org/org.db.schema';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    email: varchar('email', { length: 200 }).notNull().unique(),
    password: varchar('password', { length: 300 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    creci: varchar('creci', { length: 50 }),
    avatar_url: text('avatar_url'),
    // ── Plano / Org ───────────────────────────────────────────────────────────
    tipo_conta: text('tipo_conta').default('corretor'),      // 'corretor' | 'imobiliaria'
    role: text('role').default('owner'),                     // 'owner' | 'agent'
    organization_id: uuid('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expires_at: timestamp('expires_at').notNull(),
    created_at: timestamp('created_at').defaultNow(),
});