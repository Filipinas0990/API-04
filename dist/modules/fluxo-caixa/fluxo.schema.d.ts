import { z } from 'zod';
export declare const fluxoTipoEnum: readonly ["entrada", "saida", "financeiro"];
export declare const fluxoStatusEnum: readonly ["confirmado", "pendente", "cancelado"];
export declare const createFluxoSchema: z.ZodObject<{
    imovel_id: z.ZodOptional<z.ZodString>;
    descricao: z.ZodString;
    valor: z.ZodNumber;
    data: z.ZodString;
    categoria: z.ZodOptional<z.ZodString>;
    tipo: z.ZodEnum<{
        entrada: "entrada";
        saida: "saida";
        financeiro: "financeiro";
    }>;
    status: z.ZodDefault<z.ZodEnum<{
        pendente: "pendente";
        confirmado: "confirmado";
        cancelado: "cancelado";
    }>>;
    recorrente: z.ZodDefault<z.ZodBoolean>;
    periodicidade: z.ZodOptional<z.ZodString>;
    dia_vencimento: z.ZodOptional<z.ZodNumber>;
    descricao_despesas: z.ZodOptional<z.ZodString>;
    valor_despesas: z.ZodOptional<z.ZodNumber>;
    categoria_despesas: z.ZodOptional<z.ZodString>;
    forma_pagamento_despesas: z.ZodOptional<z.ZodString>;
    status_despesas: z.ZodOptional<z.ZodString>;
    observacoes_despesas: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateFluxoSchema: z.ZodObject<{
    imovel_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    descricao: z.ZodOptional<z.ZodString>;
    valor: z.ZodOptional<z.ZodNumber>;
    data: z.ZodOptional<z.ZodString>;
    categoria: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tipo: z.ZodOptional<z.ZodEnum<{
        entrada: "entrada";
        saida: "saida";
        financeiro: "financeiro";
    }>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        pendente: "pendente";
        confirmado: "confirmado";
        cancelado: "cancelado";
    }>>>;
    recorrente: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    periodicidade: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dia_vencimento: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    descricao_despesas: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    valor_despesas: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    categoria_despesas: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    forma_pagamento_despesas: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status_despesas: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    observacoes_despesas: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateFluxoDTO = z.infer<typeof createFluxoSchema>;
export type UpdateFluxoDTO = z.infer<typeof updateFluxoSchema>;
//# sourceMappingURL=fluxo.schema.d.ts.map