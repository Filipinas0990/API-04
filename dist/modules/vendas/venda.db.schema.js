"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendas = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const auth_schema_1 = require("../auth/auth.schema");
const lead_db_schema_1 = require("../leads/lead.db.schema");
const imovel_db_schema_1 = require("../imoveis/imovel.db.schema");
exports.vendas = (0, pg_core_1.pgTable)('vendas', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    lead_id: (0, pg_core_1.uuid)('lead_id').references(() => lead_db_schema_1.leads.id, { onDelete: 'set null' }),
    imovel_id: (0, pg_core_1.uuid)('imovel_id').references(() => imovel_db_schema_1.imoveis.id, { onDelete: 'set null' }),
    tipo: (0, pg_core_1.text)('tipo').default('Venda'),
    status: (0, pg_core_1.text)('status').default('Em negociação'),
    valor: (0, pg_core_1.decimal)('valor', { precision: 14, scale: 2 }).notNull(),
    data_venda: (0, pg_core_1.date)('data_venda'),
    observacoes: (0, pg_core_1.text)('observacoes'),
    construtora: (0, pg_core_1.text)('construtora'),
    base_calculo_tipo: (0, pg_core_1.text)('base_calculo_tipo').default('Base do cálculo porcentagem'),
    base_calculo_pct: (0, pg_core_1.decimal)('base_calculo_pct', { precision: 6, scale: 2 }).default('4.00'),
    percentual_imposto: (0, pg_core_1.decimal)('percentual_imposto', { precision: 6, scale: 2 }).default('0.00'),
    valor_indicacao: (0, pg_core_1.decimal)('valor_indicacao', { precision: 14, scale: 2 }).default('0.00'),
    premiacao_venda: (0, pg_core_1.decimal)('premiacao_venda', { precision: 14, scale: 2 }).default('0.00'),
    data_prev_comissao: (0, pg_core_1.date)('data_prev_comissao'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
//# sourceMappingURL=venda.db.schema.js.map