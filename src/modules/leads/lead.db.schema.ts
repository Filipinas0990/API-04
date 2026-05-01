import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';

export const leads = pgTable('leads', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    telefone: text('telefone').notNull(),
    email: text('email'),
    gestor_responsavel: text('gestor_responsavel'),
    temperatura: integer('temperatura').default(1), // 1=frio, 2=morno, 3=quente
    interesse: text('interesse'),
    observacoes: text('observacoes'),
    status: text('status').default('novo_cliente'),
    // novo_cliente | em_contato | visita_marcada | proposta_enviada | cliente_desistiu
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});