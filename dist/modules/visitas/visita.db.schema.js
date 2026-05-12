"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitas = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const auth_schema_1 = require("../auth/auth.schema");
const lead_db_schema_1 = require("../leads/lead.db.schema");
const imovel_db_schema_1 = require("../imoveis/imovel.db.schema");
exports.visitas = (0, pg_core_1.pgTable)('visitas', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    lead_id: (0, pg_core_1.uuid)('lead_id').references(() => lead_db_schema_1.leads.id, { onDelete: 'set null' }),
    imovel_id: (0, pg_core_1.uuid)('imovel_id').references(() => imovel_db_schema_1.imoveis.id, { onDelete: 'set null' }),
    data: (0, pg_core_1.timestamp)('data', { withTimezone: true }).notNull(),
    anotacoes: (0, pg_core_1.text)('anotacoes'),
    status: (0, pg_core_1.text)('status').default('agendada'),
    // Lembrete automático por WhatsApp
    nome_cliente: (0, pg_core_1.text)('nome_cliente'),
    telefone_cliente: (0, pg_core_1.text)('telefone_cliente'),
    lembrete_enviado_at: (0, pg_core_1.timestamp)('lembrete_enviado_at', { withTimezone: true }),
    confirmada: (0, pg_core_1.boolean)('confirmada'),
    lembrete_respondido_at: (0, pg_core_1.timestamp)('lembrete_respondido_at', { withTimezone: true }),
    tarefa_lembrete_criada: (0, pg_core_1.boolean)('tarefa_lembrete_criada').default(false),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
//# sourceMappingURL=visita.db.schema.js.map