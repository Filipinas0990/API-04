import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../database/client';
import { visitas } from './visita.db.schema';

export const visitaRepository = {
    async findAll(userId: string, filters?: {
        status?: string;
        lead_id?: string;
        imovel_id?: string;
    }) {
        const all = await db
            .select()
            .from(visitas)
            .where(eq(visitas.user_id, userId))
            .orderBy(desc(visitas.data));

        let result = all;
        if (filters?.status) result = result.filter(v => v.status === filters.status);
        if (filters?.lead_id) result = result.filter(v => v.lead_id === filters.lead_id);
        if (filters?.imovel_id) result = result.filter(v => v.imovel_id === filters.imovel_id);

        return result;
    },

    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(visitas)
            .where(and(eq(visitas.id, id), eq(visitas.user_id, userId)));
        return result[0] ?? null;
    },

    async create(userId: string, data: Record<string, unknown>) {
        const payload = {
            ...data,
            user_id: userId,
            data: data.data ? new Date(data.data as string) : new Date(),
        };
        const [visita] = await db
            .insert(visitas)
            .values(payload as typeof visitas.$inferInsert)
            .returning();
        return visita;
    },

    async update(id: string, userId: string, data: Record<string, unknown>) {
        const payload: Record<string, unknown> = { ...data, updated_at: new Date() };
        if (data.data) payload.data = new Date(data.data as string);

        const [visita] = await db
            .update(visitas)
            .set(payload as typeof visitas.$inferInsert)
            .where(and(eq(visitas.id, id), eq(visitas.user_id, userId)))
            .returning();
        return visita ?? null;
    },

    async delete(id: string, userId: string) {
        const [visita] = await db
            .delete(visitas)
            .where(and(eq(visitas.id, id), eq(visitas.user_id, userId)))
            .returning();
        return visita ?? null;
    },
};