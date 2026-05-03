import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../database/client';
import { tarefas } from './tarefa.db.schema';

export const tarefaRepository = {
    async findAll(userId: string, filters?: {
        status?: string;
        prioridade?: string;
        lead_id?: string;
    }) {
        const all = await db
            .select()
            .from(tarefas)
            .where(eq(tarefas.user_id, userId))
            .orderBy(desc(tarefas.created_at));

        let result = all;
        if (filters?.status) result = result.filter(t => t.status === filters.status);
        if (filters?.prioridade) result = result.filter(t => t.prioridade === filters.prioridade);
        if (filters?.lead_id) result = result.filter(t => t.lead_id === filters.lead_id);

        return result;
    },

    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(tarefas)
            .where(and(eq(tarefas.id, id), eq(tarefas.user_id, userId)));
        return result[0] ?? null;
    },
    async create(userId: string, data: Record<string, unknown>) {
        const parsed = {
            ...data,
            user_id: userId,
            data_inicio: data.data_inicio ? new Date(data.data_inicio as string) : null,
            data_fim: data.data_fim ? new Date(data.data_fim as string) : null,
        };
        const [tarefa] = await db
            .insert(tarefas)
            .values(parsed as typeof tarefas.$inferInsert)
            .returning();
        return tarefa;
    },

    async update(id: string, userId: string, data: Record<string, unknown>) {
        const parsed = {
            ...data,
            updated_at: new Date(),
            data_inicio: data.data_inicio ? new Date(data.data_inicio as string) : undefined,
            data_fim: data.data_fim ? new Date(data.data_fim as string) : undefined,
        };
        const [tarefa] = await db
            .update(tarefas)
            .set(parsed as typeof tarefas.$inferInsert)
            .where(and(eq(tarefas.id, id), eq(tarefas.user_id, userId)))
            .returning();
        return tarefa ?? null;
    },

    async concluir(id: string, userId: string) {
        const [tarefa] = await db
            .update(tarefas)
            .set({
                status: 'CONCLUÍDA',
                concluido: true,
                concluida_em: new Date(),
                updated_at: new Date(),
            })
            .where(and(eq(tarefas.id, id), eq(tarefas.user_id, userId)))
            .returning();
        return tarefa ?? null;
    },

    async delete(id: string, userId: string) {
        const [tarefa] = await db
            .delete(tarefas)
            .where(and(eq(tarefas.id, id), eq(tarefas.user_id, userId)))
            .returning();
        return tarefa ?? null;
    },
};