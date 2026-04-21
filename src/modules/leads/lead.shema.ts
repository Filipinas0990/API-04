// src/modules/leads/lead.schema.ts
// Zod valida os dados que chegam na requisição.
// Se faltar um campo obrigatório ou o tipo estiver errado,
// ele rejeita ANTES de chegar no controller.

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

    // 1 = frio, 2 = morno, 3 = quente
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

// Tipos derivados do schema — não precisa declarar interface separada
export type CreateLeadDTO = z.infer<typeof createLeadSchema>
export type UpdateLeadDTO = z.infer<typeof updateLeadSchema>

// Tipo do Lead completo (com id e timestamps)
export type Lead = CreateLeadDTO & {
    id: string
    createdAt: Date
    updatedAt: Date
}