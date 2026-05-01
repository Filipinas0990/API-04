import { pgTable, uuid, text, integer, boolean, decimal, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';

export const imoveis = pgTable('imoveis', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

    // Informações básicas
    titulo: text('titulo').notNull(),
    descricao: text('descricao'),
    tipo: text('tipo'),        // Casa, Apartamento, Lote, Loteamento, etc
    status: text('status').default('Ativo'), // Ativo | Em Análise | Inativo
    fase_obra: text('fase_obra').default('Sem fase definida'),
    classificacao: text('classificacao'), // Alto, Médio, Popular
    construtora: text('construtora'),

    // Preço e financeiro
    preco: decimal('preco', { precision: 14, scale: 2 }),
    preco_varia: boolean('preco_varia').default(false),
    sob_consulta: boolean('sob_consulta').default(false),
    iptu: decimal('iptu', { precision: 14, scale: 2 }),
    condominio: decimal('condominio', { precision: 14, scale: 2 }),
    renda_ideal: decimal('renda_ideal', { precision: 14, scale: 2 }),

    // Financiamento
    entrada: decimal('entrada', { precision: 14, scale: 2 }),
    parcelas: integer('parcelas'),
    taxa_juros: decimal('taxa_juros', { precision: 6, scale: 4 }),
    fgts: boolean('fgts').default(false),

    // Aluguel
    deposito: decimal('deposito', { precision: 14, scale: 2 }),
    periodo_aluguel: text('periodo_aluguel').default('Mensal'),

    // Características
    quartos: integer('quartos'),
    banheiros: integer('banheiros'),
    vagas_garagem: integer('vagas_garagem').default(0),
    area: decimal('area', { precision: 10, scale: 2 }),
    area_minima: decimal('area_minima', { precision: 10, scale: 2 }),
    area_maxima: decimal('area_maxima', { precision: 10, scale: 2 }),
    unidades_disponiveis: integer('unidades_disponiveis').default(0),
    mobiliado: boolean('mobiliado').default(false),
    aceita_pets: boolean('aceita_pets').default(false),

    // Localização
    endereco: text('endereco'),
    complemento: text('complemento'),
    bairro: text('bairro'),
    cidade: text('cidade'),
    estado: text('estado'),
    cep: text('cep'),

    // Mídia
    foto_path: text('foto_path'),
    foto_url: text('foto_url'),

    // Integração
    id_canal_pro: text('id_canal_pro'),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});