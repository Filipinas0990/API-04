import { pgTable, uuid, text, decimal, date, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';
import { leads } from '../leads/lead.db.schema';
import { imoveis } from '../imoveis/imovel.db.schema';

export const vendas = pgTable('vendas', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),


    lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    imovel_id: uuid('imovel_id').references(() => imoveis.id, { onDelete: 'set null' }),


    tipo: text('tipo').default('Venda'),
    status: text('status').default('Em negociação'),

    valor: decimal('valor', { precision: 14, scale: 2 }).notNull(),
    data_venda: date('data_venda'),
    observacoes: text('observacoes'),
    construtora: text('construtora'),

    base_calculo_tipo: text('base_calculo_tipo').default('Base do cálculo porcentagem'),
    base_calculo_pct: decimal('base_calculo_pct', { precision: 6, scale: 2 }).default('4.00'),
    percentual_imposto: decimal('percentual_imposto', { precision: 6, scale: 2 }).default('0.00'),
    valor_indicacao: decimal('valor_indicacao', { precision: 14, scale: 2 }).default('0.00'),
    premiacao_venda: decimal('premiacao_venda', { precision: 14, scale: 2 }).default('0.00'),
    data_prev_comissao: date('data_prev_comissao'),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});