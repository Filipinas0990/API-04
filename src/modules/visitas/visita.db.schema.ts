import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';
import { leads } from '../leads/lead.db.schema';
import { imoveis } from '../imoveis/imovel.db.schema';

export const visitas = pgTable('visitas', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    imovel_id: uuid('imovel_id').references(() => imoveis.id, { onDelete: 'set null' }),

    data: timestamp('data', { withTimezone: true }).notNull(),
    anotacoes: text('anotacoes'),
    status: text('status').default('agendada'),

    // Lembrete automático por WhatsApp
    nome_cliente: text('nome_cliente'),
    telefone_cliente: text('telefone_cliente'),
    lembrete_enviado_at: timestamp('lembrete_enviado_at', { withTimezone: true }),
    confirmada: boolean('confirmada'),
    lembrete_respondido_at: timestamp('lembrete_respondido_at', { withTimezone: true }),
    tarefa_lembrete_criada: boolean('tarefa_lembrete_criada').default(false),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});