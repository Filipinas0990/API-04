import { z } from 'zod';
export declare const visitaStatusEnum: readonly ["agendada", "confirmada", "realizada", "cancelada"];
export declare const createVisitaSchema: z.ZodObject<{
    lead_id: z.ZodOptional<z.ZodString>;
    imovel_id: z.ZodOptional<z.ZodString>;
    data: z.ZodString;
    anotacoes: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        agendada: "agendada";
        confirmada: "confirmada";
        realizada: "realizada";
        cancelada: "cancelada";
    }>>;
}, z.core.$strip>;
export declare const updateVisitaSchema: z.ZodObject<{
    lead_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    imovel_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    data: z.ZodOptional<z.ZodString>;
    anotacoes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        agendada: "agendada";
        confirmada: "confirmada";
        realizada: "realizada";
        cancelada: "cancelada";
    }>>>;
}, z.core.$strip>;
export declare const updateStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        agendada: "agendada";
        confirmada: "confirmada";
        realizada: "realizada";
        cancelada: "cancelada";
    }>;
}, z.core.$strip>;
export type CreateVisitaDTO = z.infer<typeof createVisitaSchema>;
export type UpdateVisitaDTO = z.infer<typeof updateVisitaSchema>;
//# sourceMappingURL=visita.schema.d.ts.map