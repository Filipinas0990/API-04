import { pgTable, uuid, text, integer, date, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';

export const metas = pgTable('metas', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tipo: text('tipo').notNull(), // 'novos_clientes' | 'visitas' | 'propostas'
    valor_alvo: integer('valor_alvo').notNull(),
    data_inicio: date('data_inicio').notNull(),
    data_fim: date('data_fim').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});
