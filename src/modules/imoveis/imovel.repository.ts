import { eq, and, gte, lte, ilike } from 'drizzle-orm';
import { db } from '../../database/client';
import { imoveis } from './imovel.db.schema';

export const imovelRepository = {
    async findAll(userId: string, filters?: {
        tipo?: string;
        status?: string;
        cidade?: string;
        preco_min?: number;
        preco_max?: number;
        search?: string;
    }) {
        const all = await db
            .select()
            .from(imoveis)
            .where(eq(imoveis.user_id, userId))
            .orderBy(imoveis.created_at);

        let result = all;

        if (filters?.tipo) result = result.filter(i => i.tipo === filters.tipo);
        if (filters?.status) result = result.filter(i => i.status === filters.status);
        if (filters?.cidade) result = result.filter(i => i.cidade?.toLowerCase().includes(filters.cidade!.toLowerCase()));
        if (filters?.preco_min) result = result.filter(i => Number(i.preco) >= filters.preco_min!);
        if (filters?.preco_max) result = result.filter(i => Number(i.preco) <= filters.preco_max!);
        if (filters?.search) {
            const s = filters.search.toLowerCase();
            result = result.filter(i =>
                i.titulo.toLowerCase().includes(s) ||
                i.bairro?.toLowerCase().includes(s) ||
                i.cidade?.toLowerCase().includes(s) ||
                i.endereco?.toLowerCase().includes(s)
            );
        }

        return result;
    },

    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(imoveis)
            .where(and(eq(imoveis.id, id), eq(imoveis.user_id, userId)));
        return result[0] ?? null;
    },

    async create(userId: string, data: Record<string, unknown>) {
        const [imovel] = await db
            .insert(imoveis)
            .values({ ...data, user_id: userId } as typeof imoveis.$inferInsert)
            .returning();
        return imovel;
    },

    async update(id: string, userId: string, data: Record<string, unknown>) {
        const [imovel] = await db
            .update(imoveis)
            .set({ ...data, updated_at: new Date() } as typeof imoveis.$inferInsert)
            .where(and(eq(imoveis.id, id), eq(imoveis.user_id, userId)))
            .returning();
        return imovel ?? null;
    },

    async delete(id: string, userId: string) {
        const [imovel] = await db
            .delete(imoveis)
            .where(and(eq(imoveis.id, id), eq(imoveis.user_id, userId)))
            .returning();
        return imovel ?? null;
    },
};