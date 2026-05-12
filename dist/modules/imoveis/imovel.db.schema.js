"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imoveis = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const auth_schema_1 = require("../auth/auth.schema");
exports.imoveis = (0, pg_core_1.pgTable)('imoveis', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_schema_1.users.id, { onDelete: 'cascade' }),
    // Informações básicas
    titulo: (0, pg_core_1.text)('titulo').notNull(),
    descricao: (0, pg_core_1.text)('descricao'),
    tipo: (0, pg_core_1.text)('tipo'), // Casa, Apartamento, Lote, Loteamento, etc
    status: (0, pg_core_1.text)('status').default('Ativo'), // Ativo | Em Análise | Inativo
    fase_obra: (0, pg_core_1.text)('fase_obra').default('Sem fase definida'),
    classificacao: (0, pg_core_1.text)('classificacao'), // Alto, Médio, Popular
    construtora: (0, pg_core_1.text)('construtora'),
    // Preço e financeiro
    preco: (0, pg_core_1.decimal)('preco', { precision: 14, scale: 2 }),
    preco_varia: (0, pg_core_1.boolean)('preco_varia').default(false),
    sob_consulta: (0, pg_core_1.boolean)('sob_consulta').default(false),
    iptu: (0, pg_core_1.decimal)('iptu', { precision: 14, scale: 2 }),
    condominio: (0, pg_core_1.decimal)('condominio', { precision: 14, scale: 2 }),
    renda_ideal: (0, pg_core_1.decimal)('renda_ideal', { precision: 14, scale: 2 }),
    // Financiamento
    entrada: (0, pg_core_1.decimal)('entrada', { precision: 14, scale: 2 }),
    parcelas: (0, pg_core_1.integer)('parcelas'),
    taxa_juros: (0, pg_core_1.decimal)('taxa_juros', { precision: 6, scale: 4 }),
    fgts: (0, pg_core_1.boolean)('fgts').default(false),
    // Aluguel
    deposito: (0, pg_core_1.decimal)('deposito', { precision: 14, scale: 2 }),
    periodo_aluguel: (0, pg_core_1.text)('periodo_aluguel').default('Mensal'),
    // Características
    quartos: (0, pg_core_1.integer)('quartos'),
    banheiros: (0, pg_core_1.integer)('banheiros'),
    vagas_garagem: (0, pg_core_1.integer)('vagas_garagem').default(0),
    area: (0, pg_core_1.decimal)('area', { precision: 10, scale: 2 }),
    area_minima: (0, pg_core_1.decimal)('area_minima', { precision: 10, scale: 2 }),
    area_maxima: (0, pg_core_1.decimal)('area_maxima', { precision: 10, scale: 2 }),
    unidades_disponiveis: (0, pg_core_1.integer)('unidades_disponiveis').default(0),
    mobiliado: (0, pg_core_1.boolean)('mobiliado').default(false),
    aceita_pets: (0, pg_core_1.boolean)('aceita_pets').default(false),
    // Localização
    endereco: (0, pg_core_1.text)('endereco'),
    complemento: (0, pg_core_1.text)('complemento'),
    bairro: (0, pg_core_1.text)('bairro'),
    cidade: (0, pg_core_1.text)('cidade'),
    estado: (0, pg_core_1.text)('estado'),
    cep: (0, pg_core_1.text)('cep'),
    // Mídia
    foto_path: (0, pg_core_1.text)('foto_path'),
    foto_url: (0, pg_core_1.text)('foto_url'),
    // Integração
    id_canal_pro: (0, pg_core_1.text)('id_canal_pro'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updated_at: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
//# sourceMappingURL=imovel.db.schema.js.map