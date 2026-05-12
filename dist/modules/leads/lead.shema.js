"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.updateLeadSchema = exports.createLeadSchema = exports.leadStatusEnum = void 0;
const zod_1 = require("zod");
exports.leadStatusEnum = [
    'novo_cliente',
    'em_contato',
    'visita_marcada',
    'proposta_enviada',
    'cliente_desistiu',
];
exports.createLeadSchema = zod_1.z.object({
    name: zod_1.z
        .string({ error: 'Nome é obrigatório' })
        .min(3, 'Nome deve ter ao menos 3 caracteres')
        .trim(),
    telefone: zod_1.z
        .string({ error: 'Telefone é obrigatório' })
        .min(10, 'Telefone inválido')
        .trim(),
    email: zod_1.z.string().email('Email inválido').optional(),
    gestor_responsavel: zod_1.z.string().optional(),
    temperatura: zod_1.z
        .number()
        .int()
        .min(1)
        .max(3)
        .default(1),
    interesse: zod_1.z.string().optional(),
    observacoes: zod_1.z.string().optional(),
    status: zod_1.z.enum(exports.leadStatusEnum).default('novo_cliente'),
});
exports.updateLeadSchema = exports.createLeadSchema.partial();
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(exports.leadStatusEnum),
});
//# sourceMappingURL=lead.shema.js.map