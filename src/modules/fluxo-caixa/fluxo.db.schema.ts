import { pgTable, uuid, text, decimal, boolean, integer, date, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';
import { imoveis } from '../imoveis/imovel.db.schema';

export const fluxoCaixa = pgTable('fluxo_caixa', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    imovel_id: uuid('imovel_id').references(() => imoveis.id, { onDelete: 'set null' }),


    descricao: text('descricao').notNull(),
    valor: decimal('valor', { precision: 14, scale: 2 }).notNull(),
    data: date('data').notNull(),
    categoria: text('categoria'),
    tipo: text('tipo').notNull(), // entrada | saida | financeiro
    status: text('status').default('confirmado'), // confirmado | pendente | cancelado


    recorrente: boolean('recorrente').default(false),
    periodicidade: text('periodicidade'), // mensal | semanal | anual
    dia_vencimento: integer('dia_vencimento'),


    descricao_despesas: text('descricao_despesas'),
    valor_despesas: decimal('valor_despesas', { precision: 14, scale: 2 }),
    categoria_despesas: text('categoria_despesas'),
    forma_pagamento_despesas: text('forma_pagamento_despesas'),
    status_despesas: text('status_despesas'),
    observacoes_despesas: text('observacoes_despesas'),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});