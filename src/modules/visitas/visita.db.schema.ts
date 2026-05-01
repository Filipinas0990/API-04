import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';
import { leads } from '../leads/lead.db.schema';
import { imoveis } from '../imoveis/imovel.db.schema';

export const visitas = pgTable('visitas', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    imovel_id: uuid('imovel_id').references(() => imoveis.id, { onDelete: 'set null' }),

    data: timestamp('data').notNull(),
    anotacoes: text('anotacoes'),
    status: text('status').default('agendada'),


    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});