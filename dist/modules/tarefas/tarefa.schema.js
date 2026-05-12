"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.updateTarefaSchema = exports.createTarefaSchema = exports.tarefaPrioridadeEnum = exports.tarefaStatusEnum = void 0;
const zod_1 = require("zod");
exports.tarefaStatusEnum = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUÍDA', 'CANCELADA'];
exports.tarefaPrioridadeEnum = ['normal', 'alta', 'urgente'];
exports.createTarefaSchema = zod_1.z.object({
    lead_id: zod_1.z.string().uuid().optional(),
    tipo: zod_1.z.string().default('tarefa'),
    titulo: zod_1.z.string().min(2, 'Título é obrigatório'),
    descricao: zod_1.z.string().optional(),
    anotacoes: zod_1.z.string().optional(),
    pessoa: zod_1.z.string().optional(),
    telefone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    organizacao: zod_1.z.string().optional(),
    prioridade: zod_1.z.enum(exports.tarefaPrioridadeEnum).default('normal'),
    status: zod_1.z.enum(exports.tarefaStatusEnum).default('PENDENTE'),
    data_inicio: zod_1.z.string().optional(),
    data_fim: zod_1.z.string().optional(),
});
exports.updateTarefaSchema = exports.createTarefaSchema.partial();
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(exports.tarefaStatusEnum),
});
//# sourceMappingURL=tarefa.schema.js.map