"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.updateVisitaSchema = exports.createVisitaSchema = exports.visitaStatusEnum = void 0;
const zod_1 = require("zod");
exports.visitaStatusEnum = ['agendada', 'confirmada', 'realizada', 'cancelada'];
exports.createVisitaSchema = zod_1.z.object({
    lead_id: zod_1.z.string().uuid().optional(),
    imovel_id: zod_1.z.string().uuid().optional(),
    data: zod_1.z.string({ error: 'Data é obrigatória' }),
    anotacoes: zod_1.z.string().optional(),
    status: zod_1.z.enum(exports.visitaStatusEnum).default('agendada'),
});
exports.updateVisitaSchema = exports.createVisitaSchema.partial();
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(exports.visitaStatusEnum),
});
//# sourceMappingURL=visita.schema.js.map