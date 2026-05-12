"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateImovelSchema = exports.createImovelSchema = void 0;
const zod_1 = require("zod");
exports.createImovelSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1, 'Título é obrigatório'),
    descricao: zod_1.z.string().optional(),
    tipo: zod_1.z.string().optional(),
    status: zod_1.z.enum([
        // Genérico
        'Ativo', 'Em Análise', 'Inativo',
        // Aluguéis
        'Disponível', 'Alugado', 'Reservado', 'Indisponível',
        // Financiamentos
        'Aprovado', 'Vendido', 'Cancelado',
        // Loteamentos
    ]).default('Ativo'),
    fase_obra: zod_1.z.string().optional(),
    classificacao: zod_1.z.string().optional(),
    construtora: zod_1.z.string().optional(),
    preco: zod_1.z.number().positive().optional(),
    preco_varia: zod_1.z.boolean().default(false),
    sob_consulta: zod_1.z.boolean().default(false),
    iptu: zod_1.z.number().optional(),
    condominio: zod_1.z.number().optional(),
    renda_ideal: zod_1.z.number().optional(),
    entrada: zod_1.z.number().optional(),
    parcelas: zod_1.z.number().int().optional(),
    taxa_juros: zod_1.z.number().optional(),
    fgts: zod_1.z.boolean().default(false),
    deposito: zod_1.z.number().optional(),
    periodo_aluguel: zod_1.z.enum(['Mensal', 'Anual', 'Temporada', 'Diária']).default('Mensal'),
    quartos: zod_1.z.number().int().optional(),
    banheiros: zod_1.z.number().int().optional(),
    vagas_garagem: zod_1.z.number().int().default(0),
    area: zod_1.z.number().optional(),
    area_minima: zod_1.z.number().optional(),
    area_maxima: zod_1.z.number().optional(),
    unidades_disponiveis: zod_1.z.number().int().default(0),
    mobiliado: zod_1.z.boolean().default(false),
    aceita_pets: zod_1.z.boolean().default(false),
    endereco: zod_1.z.string().optional(),
    complemento: zod_1.z.string().optional(),
    bairro: zod_1.z.string().optional(),
    cidade: zod_1.z.string().optional(),
    estado: zod_1.z.string().max(2).optional(),
    cep: zod_1.z.string().optional(),
    id_canal_pro: zod_1.z.string().optional(),
});
exports.updateImovelSchema = exports.createImovelSchema.partial();
//# sourceMappingURL=imovel.schema.js.map