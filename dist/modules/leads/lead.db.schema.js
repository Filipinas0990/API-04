"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leads = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const auth_schema_1 = require("../auth/auth.schema");
exports.leads = (0, pg_core_1.pgTable)('leads', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    telefone: (0, pg_core_1.text)('telefone').notNull(),
    email: (0, pg_core_1.text)('email'),
    gestor_responsavel: (0, pg_core_1.text)('gestor_responsavel'),
    temperatura: (0, pg_core_1.integer)('temperatura').default(1), // 1=frio, 2=morno, 3=quente
    interesse: (0, pg_core_1.text)('interesse'),
    observacoes: (0, pg_core_1.text)('observacoes'),
    status: (0, pg_core_1.text)('status').default('novo_cliente'),
    // novo_cliente | em_contato | visita_marcada | proposta_enviada | cliente_desistiu
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
//# sourceMappingURL=lead.db.schema.js.map