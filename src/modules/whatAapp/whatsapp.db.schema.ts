import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';
import { leads } from '../leads/lead.db.schema';

// Conversas — um por número de telefone por usuário
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
});

// Mensagens individuais
export const mensagens = pgTable('mensagens', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    conversa_id: uuid('conversa_id').references(() => conversas.id, { onDelete: 'cascade' }),
    telefone: text('telefone').notNull(),
    direcao: text('direcao').notNull(), // recebida | enviada
    conteudo: text('conteudo').notNull(),
    tipo: text('tipo').default('texto'), // texto | imagem | audio | documento
    status: text('status').default('enviada'),
    wam_id: text('wam_id'), // ID da mensagem na Evolution API
    created_at: timestamp('created_at').defaultNow(),
});

// Disparos em massa
export const disparos = pgTable('disparos', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    mensagem: text('mensagem').notNull(),
    template: text('template'), // apresentacao | followup | agendamento | oferta
    total: integer('total').default(0),
    enviados: integer('enviados').default(0),
    falhas: integer('falhas').default(0),
    status: text('status').default('pendente'), // pendente | em_andamento | concluido | cancelado
    leads_ids: jsonb('leads_ids').default([]),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// Controle de limite diário de disparos
export const disparosDiarios = pgTable('disparos_diarios', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    data: text('data').notNull(), // YYYY-MM-DD
    quantidade: integer('quantidade').default(0),
});

// Automações (fluxos de resposta automática)
export const automacoes = pgTable('automacoes', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    ativo: boolean('ativo').default(false),
    trigger: text('trigger').default('sempre'), // sempre | primeira_mensagem | palavra_chave
    palavra_chave: text('palavra_chave'),
    nos: jsonb('nos').default([]), // array de nós do fluxo
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});