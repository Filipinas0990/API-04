import { pgTable, uuid, text, boolean, integer, real, timestamp, jsonb, time, index } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';
import { leads } from '../leads/lead.db.schema';

// ── CONVERSAS ──────────────────────────────────────────
export const conversas = pgTable('conversas', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    telefone: text('telefone').notNull(),
    nome: text('nome'),
    status: text('status').default('pendente'), // pendente | em_atendimento | fechado
    ultima_msg: text('ultima_msg'),
    ultima_msg_em: timestamp('ultima_msg_em'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('conversas_user_id_idx').on(table.user_id),
    index('conversas_user_telefone_idx').on(table.user_id, table.telefone),
]);

// ── MENSAGENS ──────────────────────────────────────────
export const mensagens = pgTable('mensagens', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    conversa_id: uuid('conversa_id').references(() => conversas.id, { onDelete: 'cascade' }),
    telefone: text('telefone').notNull(),
    direcao: text('direcao').notNull(), // recebida | enviada
    conteudo: text('conteudo').notNull(),
    tipo: text('tipo').default('texto'), // texto | imagem | audio | documento
    wam_id: text('wam_id'),
    created_at: timestamp('created_at').defaultNow(),
}, (table) => [
    index('mensagens_conversa_id_idx').on(table.conversa_id),
]);

// ── DISPAROS / CAMPANHAS ───────────────────────────────
export const disparos = pgTable('disparos', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    mensagem: text('mensagem').notNull(),
    template: text('template'),
    total: integer('total').default(0),
    enviados: integer('enviados').default(0),
    falhas: integer('falhas').default(0),
    status: text('status').default('pendente'), // pendente | em_andamento | concluido | cancelado | erro
    leads_ids: jsonb('leads_ids').default([]),
    // Filtro de origem
    kanban_etapa: text('kanban_etapa'),            // etapa do kanban usada como filtro
    funil_id: uuid('funil_id'),                    // flow usado como template de mensagem
    // Anti-ban: intervalo entre disparos
    intervalo_segundos: integer('intervalo_segundos').default(60),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// ── DISPARO LOGS ──────────────────────────────────────
export const disparoLogs = pgTable('disparo_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lead_id: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    lead_name: text('lead_name'),
    phone: text('phone').notNull(),
    success: boolean('success').default(false),
    message_preview: text('message_preview'),
    sent_at: timestamp('sent_at').defaultNow(),
});

// ── DISPARO DIÁRIO (controle de limite) ───────────────
export const disparosDiarios = pgTable('disparos_diarios', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    data: text('data').notNull(), // YYYY-MM-DD
    quantidade: integer('quantidade').default(0),
}, (table) => [
    index('disparos_diarios_user_data_idx').on(table.user_id, table.data),
]);

// ── FUNIS DE DISPARO ──────────────────────────────────
export const funis = pgTable('funis', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    descricao: text('descricao'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('funis_user_id_idx').on(table.user_id),
]);

export const funilEtapas = pgTable('funil_etapas', {
    id: uuid('id').primaryKey().defaultRandom(),
    funil_id: uuid('funil_id').notNull().references(() => funis.id, { onDelete: 'cascade' }),
    ordem: integer('ordem').notNull().default(0),
    tipo: text('tipo').notNull().default('texto'), // texto | imagem | video | audio
    conteudo: text('conteudo').notNull().default(''),
    intervalo_antes: integer('intervalo_antes').notNull().default(0),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('funil_etapas_funil_id_idx').on(table.funil_id),
]);

// ── AUTOMATION FLOWS ──────────────────────────────────
export const automationFlows = pgTable('automation_flows', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    instance_name: text('instance_name').notNull(),
    name: text('name').notNull(),
    status: text('status').default('rascunho'), // rascunho | ativo | pausado
    trigger_type: text('trigger_type').default('always'), // always | primeira_mensagem | palavra_chave
    off_hours_start: text('off_hours_start').default('18:00:00'),
    off_hours_end: text('off_hours_end').default('08:00:00'),
    restart_after_hours: integer('restart_after_hours').default(24),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('flows_user_id_idx').on(table.user_id),
    index('flows_instance_status_idx').on(table.instance_name, table.status),
]);

// ── AUTOMATION NODES ──────────────────────────────────
export const automationNodes = pgTable('automation_nodes', {
    id: uuid('id').primaryKey().defaultRandom(),
    flow_id: uuid('flow_id').notNull().references(() => automationFlows.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // start | message | question | end
    label: text('label'),
    message: text('message'),
    order_index: integer('order_index').default(0),
    next_node_id: uuid('next_node_id'),
    x: integer('x').default(0),
    y: integer('y').default(0),
    delay_seconds: integer('delay_seconds').default(0),
    node_data: jsonb('node_data').default({}),
    created_at: timestamp('created_at').defaultNow(),
}, (table) => [
    index('nodes_flow_id_idx').on(table.flow_id),
]);

// ── IA CONFIG ─────────────────────────────────────────
export const iaConfig = pgTable('ia_config', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    instance_name: text('instance_name').notNull(), // ex: inst-abc12345 — para lookup no webhook
    ativo: boolean('ativo').default(false).notNull(),
    instancias: jsonb('instancias').default([]),     // [] = todas as instâncias
    openai_api_key: text('openai_api_key'),          // chave própria da empresa; null = usa a do .env
    modelo: text('modelo').default('gpt-4o-mini').notNull(),
    max_tokens: integer('max_tokens').default(500).notNull(),
    temperatura: real('temperatura').default(0.7).notNull(),
    prompt_sistema: text('prompt_sistema'),
    regras: jsonb('regras').default([]),             // [{palavra_chave, novo_status, pausar_ia}]
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('ia_config_user_id_idx').on(table.user_id),
    index('ia_config_instance_idx').on(table.instance_name),
]);

// ── AUTOMATION SESSIONS ───────────────────────────────
export const automationSessions = pgTable('automation_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    instance_name: text('instance_name').notNull(),
    phone: text('phone').notNull(),
    flow_id: uuid('flow_id').references(() => automationFlows.id, { onDelete: 'cascade' }),
    current_node_id: uuid('current_node_id'),
    status: text('status').default('active'), // active | finished | paused
    variables: jsonb('variables').default({}),
    waiting_for_input: boolean('waiting_for_input').default(false),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
    index('sessions_lookup_idx').on(table.instance_name, table.phone, table.status),
]);