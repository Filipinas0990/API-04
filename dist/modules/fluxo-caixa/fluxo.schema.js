"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFluxoSchema = exports.createFluxoSchema = exports.fluxoStatusEnum = exports.fluxoTipoEnum = void 0;
const zod_1 = require("zod");
exports.fluxoTipoEnum = ['entrada', 'saida', 'financeiro'];
exports.fluxoStatusEnum = ['confirmado', 'pendente', 'cancelado'];
exports.createFluxoSchema = zod_1.z.object({
    imovel_id: zod_1.z.string().uuid().optional(),
    descricao: zod_1.z.string().min(1, 'Descrição é obrigatória'),
    valor: zod_1.z.number().positive('Valor é obrigatório'),
    data: zod_1.z.string({ error: 'Data é obrigatória' }),
    categoria: zod_1.z.string().optional(),
    tipo: zod_1.z.enum(exports.fluxoTipoEnum),
    status: zod_1.z.enum(exports.fluxoStatusEnum).default('confirmado'),
    // Recorrência
    recorrente: zod_1.z.boolean().default(false),
    periodicidade: zod_1.z.string().optional(),
    dia_vencimento: zod_1.z.number().int().min(1).max(31).optional(),
    // Despesas
    descricao_despesas: zod_1.z.string().optional(),
    valor_despesas: zod_1.z.number().optional(),
    categoria_despesas: zod_1.z.string().optional(),
    forma_pagamento_despesas: zod_1.z.string().optional(),
    status_despesas: zod_1.z.string().optional(),
    observacoes_despesas: zod_1.z.string().optional(),
});
exports.updateFluxoSchema = exports.createFluxoSchema.partial();
//# sourceMappingURL=fluxo.schema.js.map