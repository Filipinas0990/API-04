"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationSessions = exports.iaConfig = exports.automationNodes = exports.automationFlows = exports.funilEtapas = exports.funis = exports.disparosDiarios = exports.disparoLogs = exports.disparos = exports.mensagens = exports.conversas = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const auth_schema_1 = require("../auth/auth.schema");
const lead_db_schema_1 = require("../leads/lead.db.schema");
// ── CONVERSAS ──────────────────────────────────────────
exports.conversas = (0, pg_core_1.pgTable)('conversas', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    lead_id: (0, pg_core_1.uuid)('lead_id').references(() => lead_db_schema_1.leads.id, { onDelete: 'set null' }),
    telefone: (0, pg_core_1.text)('telefone').notNull(),
    nome: (0, pg_core_1.text)('nome'),
    status: (0, pg_core_1.text)('status').default('pendente'), // pendente | em_atendimento | fechado
    ultima_msg: (0, pg_core_1.text)('ultima_msg'),
    ultima_msg_em: (0, pg_core_1.timestamp)('ultima_msg_em'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('conversas_user_id_idx').on(table.user_id),
    (0, pg_core_1.index)('conversas_user_telefone_idx').on(table.user_id, table.telefone),
]);
// ── MENSAGENS ──────────────────────────────────────────
exports.mensagens = (0, pg_core_1.pgTable)('mensagens', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    conversa_id: (0, pg_core_1.uuid)('conversa_id').references(() => exports.conversas.id, { onDelete: 'cascade' }),
    telefone: (0, pg_core_1.text)('telefone').notNull(),
    direcao: (0, pg_core_1.text)('direcao').notNull(), // recebida | enviada
    conteudo: (0, pg_core_1.text)('conteudo').notNull(),
    tipo: (0, pg_core_1.text)('tipo').default('texto'), // texto | imagem | audio | documento
    wam_id: (0, pg_core_1.text)('wam_id'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('mensagens_conversa_id_idx').on(table.conversa_id),
]);
// ── DISPAROS / CAMPANHAS ───────────────────────────────
exports.disparos = (0, pg_core_1.pgTable)('disparos', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    mensagem: (0, pg_core_1.text)('mensagem').notNull(),
    template: (0, pg_core_1.text)('template'),
    total: (0, pg_core_1.integer)('total').default(0),
    enviados: (0, pg_core_1.integer)('enviados').default(0),
    falhas: (0, pg_core_1.integer)('falhas').default(0),
    status: (0, pg_core_1.text)('status').default('pendente'), // pendente | em_andamento | concluido | cancelado | erro
    leads_ids: (0, pg_core_1.jsonb)('leads_ids').default([]),
    // Filtro de origem
    kanban_etapa: (0, pg_core_1.text)('kanban_etapa'), // etapa do kanban usada como filtro
    funil_id: (0, pg_core_1.uuid)('funil_id'), // flow usado como template de mensagem
    // Anti-ban: intervalo entre disparos
    intervalo_segundos: (0, pg_core_1.integer)('intervalo_segundos').default(60),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
// ── DISPARO LOGS ──────────────────────────────────────
exports.disparoLogs = (0, pg_core_1.pgTable)('disparo_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    lead_id: (0, pg_core_1.uuid)('lead_id').references(() => lead_db_schema_1.leads.id, { onDelete: 'set null' }),
    lead_name: (0, pg_core_1.text)('lead_name'),
    phone: (0, pg_core_1.text)('phone').notNull(),
    success: (0, pg_core_1.boolean)('success').default(false),
    message_preview: (0, pg_core_1.text)('message_preview'),
    sent_at: (0, pg_core_1.timestamp)('sent_at').defaultNow(),
});
// ── DISPARO DIÁRIO (controle de limite) ───────────────
exports.disparosDiarios = (0, pg_core_1.pgTable)('disparos_diarios', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    data: (0, pg_core_1.text)('data').notNull(), // YYYY-MM-DD
    quantidade: (0, pg_core_1.integer)('quantidade').default(0),
}, (table) => [
    (0, pg_core_1.index)('disparos_diarios_user_data_idx').on(table.user_id, table.data),
]);
// ── FUNIS DE DISPARO ──────────────────────────────────
exports.funis = (0, pg_core_1.pgTable)('funis', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    nome: (0, pg_core_1.text)('nome').notNull(),
    descricao: (0, pg_core_1.text)('descricao'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('funis_user_id_idx').on(table.user_id),
]);
exports.funilEtapas = (0, pg_core_1.pgTable)('funil_etapas', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    funil_id: (0, pg_core_1.uuid)('funil_id').notNull().references(() => exports.funis.id, { onDelete: 'cascade' }),
    ordem: (0, pg_core_1.integer)('ordem').notNull().default(0),
    tipo: (0, pg_core_1.text)('tipo').notNull().default('texto'), // texto | imagem | video | audio
    conteudo: (0, pg_core_1.text)('conteudo').notNull().default(''),
    intervalo_antes: (0, pg_core_1.integer)('intervalo_antes').notNull().default(0),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('funil_etapas_funil_id_idx').on(table.funil_id),
]);
// ── AUTOMATION FLOWS ──────────────────────────────────
exports.automationFlows = (0, pg_core_1.pgTable)('automation_flows', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    instance_name: (0, pg_core_1.text)('instance_name').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    status: (0, pg_core_1.text)('status').default('rascunho'), // rascunho | ativo | pausado
    trigger_type: (0, pg_core_1.text)('trigger_type').default('always'), // always | primeira_mensagem | palavra_chave
    off_hours_start: (0, pg_core_1.text)('off_hours_start').default('18:00:00'),
    off_hours_end: (0, pg_core_1.text)('off_hours_end').default('08:00:00'),
    restart_after_hours: (0, pg_core_1.integer)('restart_after_hours').default(24),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('flows_user_id_idx').on(table.user_id),
    (0, pg_core_1.index)('flows_instance_status_idx').on(table.instance_name, table.status),
]);
// ── AUTOMATION NODES ──────────────────────────────────
exports.automationNodes = (0, pg_core_1.pgTable)('automation_nodes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    flow_id: (0, pg_core_1.uuid)('flow_id').notNull().references(() => exports.automationFlows.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.text)('type').notNull(), // start | message | question | end
    label: (0, pg_core_1.text)('label'),
    message: (0, pg_core_1.text)('message'),
    order_index: (0, pg_core_1.integer)('order_index').default(0),
    next_node_id: (0, pg_core_1.uuid)('next_node_id'),
    x: (0, pg_core_1.integer)('x').default(0),
    y: (0, pg_core_1.integer)('y').default(0),
    delay_seconds: (0, pg_core_1.integer)('delay_seconds').default(0),
    node_data: (0, pg_core_1.jsonb)('node_data').default({}),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('nodes_flow_id_idx').on(table.flow_id),
]);
// ── IA CONFIG ─────────────────────────────────────────
exports.iaConfig = (0, pg_core_1.pgTable)('ia_config', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().unique().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    instance_name: (0, pg_core_1.text)('instance_name').notNull(), // ex: inst-abc12345 — para lookup no webhook
    ativo: (0, pg_core_1.boolean)('ativo').default(false).notNull(),
    instancias: (0, pg_core_1.jsonb)('instancias').default([]), // [] = todas as instâncias
    openai_api_key: (0, pg_core_1.text)('openai_api_key'), // chave própria da empresa; null = usa a do .env
    modelo: (0, pg_core_1.text)('modelo').default('gpt-4o-mini').notNull(),
    max_tokens: (0, pg_core_1.integer)('max_tokens').default(500).notNull(),
    temperatura: (0, pg_core_1.real)('temperatura').default(0.7).notNull(),
    prompt_sistema: (0, pg_core_1.text)('prompt_sistema'),
    regras: (0, pg_core_1.jsonb)('regras').default([]), // [{palavra_chave, novo_status, pausar_ia}]
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('ia_config_user_id_idx').on(table.user_id),
    (0, pg_core_1.index)('ia_config_instance_idx').on(table.instance_name),
]);
// ── AUTOMATION SESSIONS ───────────────────────────────
exports.automationSessions = (0, pg_core_1.pgTable)('automation_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    instance_name: (0, pg_core_1.text)('instance_name').notNull(),
    phone: (0, pg_core_1.text)('phone').notNull(),
    flow_id: (0, pg_core_1.uuid)('flow_id').references(() => exports.automationFlows.id, { onDelete: 'cascade' }),
    current_node_id: (0, pg_core_1.uuid)('current_node_id'),
    status: (0, pg_core_1.text)('status').default('active'), // active | finished | paused
    variables: (0, pg_core_1.jsonb)('variables').default({}),
    waiting_for_input: (0, pg_core_1.boolean)('waiting_for_input').default(false),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('sessions_lookup_idx').on(table.instance_name, table.phone, table.status),
]);
//# sourceMappingURL=whatsapp.db.schema.js.map