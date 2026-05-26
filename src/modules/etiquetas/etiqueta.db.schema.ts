import { pgTable, uuid, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';
import { leads } from '../leads/lead.db.schema';

export const etiquetas = pgTable('etiquetas', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('#6366f1'),
    icon: text('icon').notNull().default('tag'),
    keyword_trigger: text('keyword_trigger'),
    keyword_type: text('keyword_type').notNull().default('contains'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const leadEtiquetas = pgTable('lead_etiquetas', {
    lead_id: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    etiqueta_id: uuid('etiqueta_id').notNull().references(() => etiquetas.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at').defaultNow(),
}, (t) => [
    primaryKey({ columns: [t.lead_id, t.etiqueta_id] }),
]);
