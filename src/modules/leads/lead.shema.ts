
import { z } from 'zod'

export const createLeadSchema = z.object({
    name: z
        .string({ error: 'Nome é obrigatório' })
        .min(2, 'Nome deve ter ao menos 2 caracteres')
        .trim(),

    telefone: z
        .string({ error: 'Telefone é obrigatório' })
        .min(10, 'Telefone inválido')
        .trim(),

    gestor_responsavel: z
        .string()
        .optional(),


    temperatura: z
        .number()
        .int()
        .min(1)
        .max(3)
        .default(1),

    interesse: z
        .string()
        .optional(),

    observacoes: z
        .string()
        .optional(),
})

export const updateLeadSchema = createLeadSchema.partial()


export type CreateLeadDTO = z.infer<typeof createLeadSchema>
export type UpdateLeadDTO = z.infer<typeof updateLeadSchema>


export type Lead = CreateLeadDTO & {
    id: string
    createdAt: Date
    updatedAt: Date
}