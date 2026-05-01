import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';
import { leads } from '../leads/lead.db.schema';

export const tarefas = pgTable('tarefas', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),

    tipo: text('tipo').default('tarefa'),
    titulo: text('titulo').notNull(),
    descricao: text('descricao'),
    anotacoes: text('anotacoes'),


    pessoa: text('pessoa'),
    telefone: text('telefone'),
    email: text('email'),
    organizacao: text('organizacao'),

    prioridade: text('prioridade').default('normal'),
    status: text('status').default('PENDENTE'),
    concluido: boolean('concluido').default(false),

    data_inicio: timestamp('data_inicio'),
    data_fim: timestamp('data_fim'),
    concluida_em: timestamp('concluida_em'),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});