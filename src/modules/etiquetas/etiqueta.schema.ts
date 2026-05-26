import { z } from 'zod';

export const createEtiquetaSchema = z.object({
    name: z.string().min(1).max(50).trim(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
    icon: z.string().default('tag'),
    keyword_trigger: z.string().trim().optional(),
    keyword_type: z.enum(['contains']).default('contains'),
});

export const updateEtiquetaSchema = createEtiquetaSchema.partial();

export type CreateEtiquetaDTO = z.infer<typeof createEtiquetaSchema>;
export type UpdateEtiquetaDTO = z.infer<typeof updateEtiquetaSchema>;
