import { z } from 'zod';
export declare const tarefaStatusEnum: readonly ["PENDENTE", "EM_ANDAMENTO", "CONCLUÍDA", "CANCELADA"];
export declare const tarefaPrioridadeEnum: readonly ["normal", "alta", "urgente"];
export declare const createTarefaSchema: z.ZodObject<{
    lead_id: z.ZodOptional<z.ZodString>;
    tipo: z.ZodDefault<z.ZodString>;
    titulo: z.ZodString;
    descricao: z.ZodOptional<z.ZodString>;
    anotacoes: z.ZodOptional<z.ZodString>;
    pessoa: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    organizacao: z.ZodOptional<z.ZodString>;
    prioridade: z.ZodDefault<z.ZodEnum<{
        normal: "normal";
        alta: "alta";
        urgente: "urgente";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        PENDENTE: "PENDENTE";
        EM_ANDAMENTO: "EM_ANDAMENTO";
        CONCLUÍDA: "CONCLUÍDA";
        CANCELADA: "CANCELADA";
    }>>;
    data_inicio: z.ZodOptional<z.ZodString>;
    data_fim: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateTarefaSchema: z.ZodObject<{
    lead_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tipo: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    titulo: z.ZodOptional<z.ZodString>;
    descricao: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    anotacoes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pessoa: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    telefone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    organizacao: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    prioridade: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        normal: "normal";
        alta: "alta";
        urgente: "urgente";
    }>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        PENDENTE: "PENDENTE";
        EM_ANDAMENTO: "EM_ANDAMENTO";
        CONCLUÍDA: "CONCLUÍDA";
        CANCELADA: "CANCELADA";
    }>>>;
    data_inicio: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    data_fim: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const updateStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        PENDENTE: "PENDENTE";
        EM_ANDAMENTO: "EM_ANDAMENTO";
        CONCLUÍDA: "CONCLUÍDA";
        CANCELADA: "CANCELADA";
    }>;
}, z.core.$strip>;
export type CreateTarefaDTO = z.infer<typeof createTarefaSchema>;
export type UpdateTarefaDTO = z.infer<typeof updateTarefaSchema>;
//# sourceMappingURL=tarefa.schema.d.ts.map