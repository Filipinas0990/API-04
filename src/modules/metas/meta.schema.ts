import { z } from 'zod';

export const createMetaSchema = z.object({
    tipo: z.enum(['novos_clientes', 'visitas', 'propostas']),
    valor_alvo: z.number().int().positive(),
    data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
    data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
});

export const updateMetaSchema = createMetaSchema.partial();

export type CreateMetaDTO = z.infer<typeof createMetaSchema>;
export type UpdateMetaDTO = z.infer<typeof updateMetaSchema>;
