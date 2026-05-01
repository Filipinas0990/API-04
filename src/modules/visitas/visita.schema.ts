import { z } from 'zod';

export const visitaStatusEnum = ['agendada', 'confirmada', 'realizada', 'cancelada'] as const;

export const createVisitaSchema = z.object({
    lead_id: z.string().uuid().optional(),
    imovel_id: z.string().uuid().optional(),
    data: z.string({ error: 'Data é obrigatória' }),
    anotacoes: z.string().optional(),
    status: z.enum(visitaStatusEnum).default('agendada'),
});

export const updateVisitaSchema = createVisitaSchema.partial();

export const updateStatusSchema = z.object({
    status: z.enum(visitaStatusEnum),
});

export type CreateVisitaDTO = z.infer<typeof createVisitaSchema>;
export type UpdateVisitaDTO = z.infer<typeof updateVisitaSchema>;