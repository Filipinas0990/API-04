import { z } from 'zod';

export const vendaStatusEnum = [
    'Em negociação',
    'Proposta enviada',
    'Contrato assinado',
    'Concluída',
    'Cancelada',
] as const;

export const vendaTipoEnum = ['Venda', 'Locação', 'Permuta'] as const;

export const createVendaSchema = z.object({
    lead_id: z.string().uuid().optional(),
    imovel_id: z.string().uuid().optional(),
    tipo: z.enum(vendaTipoEnum).default('Venda'),
    status: z.enum(vendaStatusEnum).default('Em negociação'),
    valor: z.number().positive('Valor é obrigatório'),
    data_venda: z.string().optional(),
    observacoes: z.string().optional(),
    construtora: z.string().optional(),

    // Comissão
    base_calculo_tipo: z.string().optional(),
    base_calculo_pct: z.number().min(0).max(100).default(4),
    percentual_imposto: z.number().min(0).max(100).default(0),
    valor_indicacao: z.number().min(0).default(0),
    premiacao_venda: z.number().min(0).default(0),
    data_prev_comissao: z.string().optional(),
});

export const updateVendaSchema = createVendaSchema.partial();

export const updateStatusSchema = z.object({
    status: z.enum(vendaStatusEnum),
});

export type CreateVendaDTO = z.infer<typeof createVendaSchema>;
export type UpdateVendaDTO = z.infer<typeof updateVendaSchema>;