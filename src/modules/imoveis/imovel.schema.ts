import { z } from 'zod';

export const createImovelSchema = z.object({
    titulo: z.string().min(1, 'Título é obrigatório'),
    descricao: z.string().optional(),
    tipo: z.string().optional(),
    status: z.enum(['Ativo', 'Em Análise', 'Inativo']).default('Ativo'),
    fase_obra: z.string().optional(),
    classificacao: z.string().optional(),
    construtora: z.string().optional(),

    preco: z.number().positive().optional(),
    preco_varia: z.boolean().default(false),
    sob_consulta: z.boolean().default(false),
    iptu: z.number().optional(),
    condominio: z.number().optional(),
    renda_ideal: z.number().optional(),

    entrada: z.number().optional(),
    parcelas: z.number().int().optional(),
    taxa_juros: z.number().optional(),
    fgts: z.boolean().default(false),


    deposito: z.number().optional(),
    periodo_aluguel: z.enum(['Mensal', 'Anual', 'Temporada']).default('Mensal'),


    quartos: z.number().int().optional(),
    banheiros: z.number().int().optional(),
    vagas_garagem: z.number().int().default(0),
    area: z.number().optional(),
    area_minima: z.number().optional(),
    area_maxima: z.number().optional(),
    unidades_disponiveis: z.number().int().default(0),
    mobiliado: z.boolean().default(false),
    aceita_pets: z.boolean().default(false),

    endereco: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().max(2).optional(),
    cep: z.string().optional(),


    id_canal_pro: z.string().optional(),
});

export const updateImovelSchema = createImovelSchema.partial();

export type CreateImovelDTO = z.infer<typeof createImovelSchema>;
export type UpdateImovelDTO = z.infer<typeof updateImovelSchema>;