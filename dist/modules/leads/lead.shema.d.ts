import { z } from 'zod';
export declare const leadStatusEnum: readonly ["novo_cliente", "em_contato", "visita_marcada", "proposta_enviada", "cliente_desistiu"];
export declare const createLeadSchema: z.ZodObject<{
    name: z.ZodString;
    telefone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    gestor_responsavel: z.ZodOptional<z.ZodString>;
    temperatura: z.ZodDefault<z.ZodNumber>;
    interesse: z.ZodOptional<z.ZodString>;
    observacoes: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        novo_cliente: "novo_cliente";
        em_contato: "em_contato";
        visita_marcada: "visita_marcada";
        proposta_enviada: "proposta_enviada";
        cliente_desistiu: "cliente_desistiu";
    }>>;
}, z.core.$strip>;
export declare const updateLeadSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    telefone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    gestor_responsavel: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    temperatura: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    interesse: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    observacoes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        novo_cliente: "novo_cliente";
        em_contato: "em_contato";
        visita_marcada: "visita_marcada";
        proposta_enviada: "proposta_enviada";
        cliente_desistiu: "cliente_desistiu";
    }>>>;
}, z.core.$strip>;
export declare const updateStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        novo_cliente: "novo_cliente";
        em_contato: "em_contato";
        visita_marcada: "visita_marcada";
        proposta_enviada: "proposta_enviada";
        cliente_desistiu: "cliente_desistiu";
    }>;
}, z.core.$strip>;
export type CreateLeadDTO = z.infer<typeof createLeadSchema>;
export type UpdateLeadDTO = z.infer<typeof updateLeadSchema>;
export type LeadStatus = typeof leadStatusEnum[number];
//# sourceMappingURL=lead.shema.d.ts.map