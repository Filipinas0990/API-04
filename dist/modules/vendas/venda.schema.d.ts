import { z } from 'zod';
export declare const vendaStatusEnum: readonly ["Em negociação", "Proposta enviada", "Contrato assinado", "Concluída", "Cancelada"];
export declare const vendaTipoEnum: readonly ["Venda", "Locação", "Permuta"];
export declare const createVendaSchema: z.ZodObject<{
    lead_id: z.ZodOptional<z.ZodString>;
    imovel_id: z.ZodOptional<z.ZodString>;
    tipo: z.ZodDefault<z.ZodEnum<{
        Venda: "Venda";
        Locação: "Locação";
        Permuta: "Permuta";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        "Em negocia\u00E7\u00E3o": "Em negociação";
        "Proposta enviada": "Proposta enviada";
        "Contrato assinado": "Contrato assinado";
        Concluída: "Concluída";
        Cancelada: "Cancelada";
    }>>;
    valor: z.ZodNumber;
    data_venda: z.ZodOptional<z.ZodString>;
    observacoes: z.ZodOptional<z.ZodString>;
    construtora: z.ZodOptional<z.ZodString>;
    base_calculo_tipo: z.ZodOptional<z.ZodString>;
    base_calculo_pct: z.ZodDefault<z.ZodNumber>;
    percentual_imposto: z.ZodDefault<z.ZodNumber>;
    valor_indicacao: z.ZodDefault<z.ZodNumber>;
    premiacao_venda: z.ZodDefault<z.ZodNumber>;
    data_prev_comissao: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateVendaSchema: z.ZodObject<{
    lead_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    imovel_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tipo: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        Venda: "Venda";
        Locação: "Locação";
        Permuta: "Permuta";
    }>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        "Em negocia\u00E7\u00E3o": "Em negociação";
        "Proposta enviada": "Proposta enviada";
        "Contrato assinado": "Contrato assinado";
        Concluída: "Concluída";
        Cancelada: "Cancelada";
    }>>>;
    valor: z.ZodOptional<z.ZodNumber>;
    data_venda: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    observacoes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    construtora: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    base_calculo_tipo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    base_calculo_pct: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    percentual_imposto: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    valor_indicacao: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    premiacao_venda: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    data_prev_comissao: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const updateStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        "Em negocia\u00E7\u00E3o": "Em negociação";
        "Proposta enviada": "Proposta enviada";
        "Contrato assinado": "Contrato assinado";
        Concluída: "Concluída";
        Cancelada: "Cancelada";
    }>;
}, z.core.$strip>;
export type CreateVendaDTO = z.infer<typeof createVendaSchema>;
export type UpdateVendaDTO = z.infer<typeof updateVendaSchema>;
//# sourceMappingURL=venda.schema.d.ts.map