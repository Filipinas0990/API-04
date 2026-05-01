import { z } from 'zod';

export const tarefaStatusEnum = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUÍDA', 'CANCELADA'] as const;
export const tarefaPrioridadeEnum = ['normal', 'alta', 'urgente'] as const;

export const createTarefaSchema = z.object({
    lead_id: z.string().uuid().optional(),
    tipo: z.string().default('tarefa'),
    titulo: z.string().min(2, 'Título é obrigatório'),
    descricao: z.string().optional(),
    anotacoes: z.string().optional(),
    pessoa: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email().optional(),
    organizacao: z.string().optional(),
    prioridade: z.enum(tarefaPrioridadeEnum).default('normal'),
    status: z.enum(tarefaStatusEnum).default('PENDENTE'),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
});

export const updateTarefaSchema = createTarefaSchema.partial();

export const updateStatusSchema = z.object({
    status: z.enum(tarefaStatusEnum),
});

export type CreateTarefaDTO = z.infer<typeof createTarefaSchema>;
export type UpdateTarefaDTO = z.infer<typeof updateTarefaSchema>;