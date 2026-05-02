import { z } from 'zod';

export const fluxoTipoEnum = ['entrada', 'saida', 'financeiro'] as const;
export const fluxoStatusEnum = ['confirmado', 'pendente', 'cancelado'] as const;

export const createFluxoSchema = z.object({
    imovel_id: z.string().uuid().optional(),
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    valor: z.number().positive('Valor é obrigatório'),
    data: z.string({ error: 'Data é obrigatória' }),
    categoria: z.string().optional(),
    tipo: z.enum(fluxoTipoEnum),
    status: z.enum(fluxoStatusEnum).default('confirmado'),

    // Recorrência
    recorrente: z.boolean().default(false),
    periodicidade: z.string().optional(),
    dia_vencimento: z.number().int().min(1).max(31).optional(),

    // Despesas
    descricao_despesas: z.string().optional(),
    valor_despesas: z.number().optional(),
    categoria_despesas: z.string().optional(),
    forma_pagamento_despesas: z.string().optional(),
    status_despesas: z.string().optional(),
    observacoes_despesas: z.string().optional(),
});

export const updateFluxoSchema = createFluxoSchema.partial();

export type CreateFluxoDTO = z.infer<typeof createFluxoSchema>;
export type UpdateFluxoDTO = z.infer<typeof updateFluxoSchema>;