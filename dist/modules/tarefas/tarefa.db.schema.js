"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tarefas = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const auth_schema_1 = require("../auth/auth.schema");
const lead_db_schema_1 = require("../leads/lead.db.schema");
exports.tarefas = (0, pg_core_1.pgTable)('tarefas', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    lead_id: (0, pg_core_1.uuid)('lead_id').references(() => lead_db_schema_1.leads.id, { onDelete: 'set null' }),
    tipo: (0, pg_core_1.text)('tipo').default('tarefa'),
    titulo: (0, pg_core_1.text)('titulo').notNull(),
    descricao: (0, pg_core_1.text)('descricao'),
    anotacoes: (0, pg_core_1.text)('anotacoes'),
    pessoa: (0, pg_core_1.text)('pessoa'),
    telefone: (0, pg_core_1.text)('telefone'),
    email: (0, pg_core_1.text)('email'),
    organizacao: (0, pg_core_1.text)('organizacao'),
    prioridade: (0, pg_core_1.text)('prioridade').default('normal'),
    status: (0, pg_core_1.text)('status').default('PENDENTE'),
    concluido: (0, pg_core_1.boolean)('concluido').default(false),
    data_inicio: (0, pg_core_1.timestamp)('data_inicio'),
    data_fim: (0, pg_core_1.timestamp)('data_fim'),
    concluida_em: (0, pg_core_1.timestamp)('concluida_em'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
//# sourceMappingURL=tarefa.db.schema.js.map