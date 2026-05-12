"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fluxoCaixa = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const auth_schema_1 = require("../auth/auth.schema");
const imovel_db_schema_1 = require("../imoveis/imovel.db.schema");
exports.fluxoCaixa = (0, pg_core_1.pgTable)('fluxo_caixa', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    imovel_id: (0, pg_core_1.uuid)('imovel_id').references(() => imovel_db_schema_1.imoveis.id, { onDelete: 'set null' }),
    descricao: (0, pg_core_1.text)('descricao').notNull(),
    valor: (0, pg_core_1.decimal)('valor', { precision: 14, scale: 2 }).notNull(),
    data: (0, pg_core_1.date)('data').notNull(),
    categoria: (0, pg_core_1.text)('categoria'),
    tipo: (0, pg_core_1.text)('tipo').notNull(), // entrada | saida | financeiro
    status: (0, pg_core_1.text)('status').default('confirmado'), // confirmado | pendente | cancelado
    recorrente: (0, pg_core_1.boolean)('recorrente').default(false),
    periodicidade: (0, pg_core_1.text)('periodicidade'), // mensal | semanal | anual
    dia_vencimento: (0, pg_core_1.integer)('dia_vencimento'),
    descricao_despesas: (0, pg_core_1.text)('descricao_despesas'),
    valor_despesas: (0, pg_core_1.decimal)('valor_despesas', { precision: 14, scale: 2 }),
    categoria_despesas: (0, pg_core_1.text)('categoria_despesas'),
    forma_pagamento_despesas: (0, pg_core_1.text)('forma_pagamento_despesas'),
    status_despesas: (0, pg_core_1.text)('status_despesas'),
    observacoes_despesas: (0, pg_core_1.text)('observacoes_despesas'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
//# sourceMappingURL=fluxo.db.schema.js.map