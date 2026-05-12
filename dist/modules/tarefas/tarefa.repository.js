"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tarefaRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../database/client");
const tarefa_db_schema_1 = require("./tarefa.db.schema");
exports.tarefaRepository = {
    async findAll(userId, filters) {
        const all = await client_1.db
            .select()
            .from(tarefa_db_schema_1.tarefas)
            .where((0, drizzle_orm_1.eq)(tarefa_db_schema_1.tarefas.user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(tarefa_db_schema_1.tarefas.created_at));
        let result = all;
        if (filters?.status)
            result = result.filter(t => t.status === filters.status);
        if (filters?.prioridade)
            result = result.filter(t => t.prioridade === filters.prioridade);
        if (filters?.lead_id)
            result = result.filter(t => t.lead_id === filters.lead_id);
        return result;
    },
    async findById(id, userId) {
        const result = await client_1.db
            .select()
            .from(tarefa_db_schema_1.tarefas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(tarefa_db_schema_1.tarefas.id, id), (0, drizzle_orm_1.eq)(tarefa_db_schema_1.tarefas.user_id, userId)));
        return result[0] ?? null;
    },
    async create(userId, data) {
        const parsed = {
            ...data,
            user_id: userId,
            data_inicio: data.data_inicio ? new Date(data.data_inicio) : null,
            data_fim: data.data_fim ? new Date(data.data_fim) : null,
        };
        const [tarefa] = await client_1.db
            .insert(tarefa_db_schema_1.tarefas)
            .values(parsed)
            .returning();
        return tarefa;
    },
    async update(id, userId, data) {
        const parsed = {
            ...data,
            updated_at: new Date(),
            data_inicio: data.data_inicio ? new Date(data.data_inicio) : undefined,
            data_fim: data.data_fim ? new Date(data.data_fim) : undefined,
        };
        const [tarefa] = await client_1.db
            .update(tarefa_db_schema_1.tarefas)
            .set(parsed)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(tarefa_db_schema_1.tarefas.id, id), (0, drizzle_orm_1.eq)(tarefa_db_schema_1.tarefas.user_id, userId)))
            .returning();
        return tarefa ?? null;
    },
    async concluir(id, userId) {
        const [tarefa] = await client_1.db
            .update(tarefa_db_schema_1.tarefas)
            .set({
            status: 'CONCLUÍDA',
            concluido: true,
            concluida_em: new Date(),
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(tarefa_db_schema_1.tarefas.id, id), (0, drizzle_orm_1.eq)(tarefa_db_schema_1.tarefas.user_id, userId)))
            .returning();
        return tarefa ?? null;
    },
    async delete(id, userId) {
        const [tarefa] = await client_1.db
            .delete(tarefa_db_schema_1.tarefas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(tarefa_db_schema_1.tarefas.id, id), (0, drizzle_orm_1.eq)(tarefa_db_schema_1.tarefas.user_id, userId)))
            .returning();
        return tarefa ?? null;
    },
};
//# sourceMappingURL=tarefa.repository.js.map