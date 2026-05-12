"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.updateVendaSchema = exports.createVendaSchema = exports.vendaTipoEnum = exports.vendaStatusEnum = void 0;
const zod_1 = require("zod");
exports.vendaStatusEnum = [
    'Em negociação',
    'Proposta enviada',
    'Contrato assinado',
    'Concluída',
    'Cancelada',
];
exports.vendaTipoEnum = ['Venda', 'Locação', 'Permuta'];
exports.createVendaSchema = zod_1.z.object({
    lead_id: zod_1.z.string().uuid().optional(),
    imovel_id: zod_1.z.string().uuid().optional(),
    tipo: zod_1.z.enum(exports.vendaTipoEnum).default('Venda'),
    status: zod_1.z.enum(exports.vendaStatusEnum).default('Em negociação'),
    valor: zod_1.z.number().positive('Valor é obrigatório'),
    data_venda: zod_1.z.string().optional(),
    observacoes: zod_1.z.string().optional(),
    construtora: zod_1.z.string().optional(),
    // Comissão
    base_calculo_tipo: zod_1.z.string().optional(),
    base_calculo_pct: zod_1.z.number().min(0).max(100).default(4),
    percentual_imposto: zod_1.z.number().min(0).max(100).default(0),
    valor_indicacao: zod_1.z.number().min(0).default(0),
    premiacao_venda: zod_1.z.number().min(0).default(0),
    data_prev_comissao: zod_1.z.string().optional(),
});
exports.updateVendaSchema = exports.createVendaSchema.partial();
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(exports.vendaStatusEnum),
});
//# sourceMappingURL=venda.schema.js.map