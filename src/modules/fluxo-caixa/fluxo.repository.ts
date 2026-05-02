import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../database/client';
import { fluxoCaixa } from './fluxo.db.schema';

export const fluxoRepository = {
    async findAll(userId: string, filters?: {
        tipo?: string;
        status?: string;
        categoria?: string;
    }) {
        const all = await db
            .select()
            .from(fluxoCaixa)
            .where(eq(fluxoCaixa.user_id, userId))
            .orderBy(desc(fluxoCaixa.data));

        let result = all;
        if (filters?.tipo) result = result.filter(f => f.tipo === filters.tipo);
        if (filters?.status) result = result.filter(f => f.status === filters.status);
        if (filters?.categoria) result = result.filter(f => f.categoria === filters.categoria);

        return result;
    },

    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(fluxoCaixa)
            .where(and(eq(fluxoCaixa.id, id), eq(fluxoCaixa.user_id, userId)));
        return result[0] ?? null;
    },

    async create(userId: string, data: Record<string, unknown>) {
        const [fluxo] = await db
            .insert(fluxoCaixa)
            .values({ ...data, user_id: userId } as typeof fluxoCaixa.$inferInsert)
            .returning();
        return fluxo;
    },

    async update(id: string, userId: string, data: Record<string, unknown>) {
        const [fluxo] = await db
            .update(fluxoCaixa)
            .set({ ...data, updated_at: new Date() } as typeof fluxoCaixa.$inferInsert)
            .where(and(eq(fluxoCaixa.id, id), eq(fluxoCaixa.user_id, userId)))
            .returning();
        return fluxo ?? null;
    },

    async delete(id: string, userId: string) {
        const [fluxo] = await db
            .delete(fluxoCaixa)
            .where(and(eq(fluxoCaixa.id, id), eq(fluxoCaixa.user_id, userId)))
            .returning();
        return fluxo ?? null;
    },

    async getSaldo(userId: string) {
        const all = await db
            .select()
            .from(fluxoCaixa)
            .where(eq(fluxoCaixa.user_id, userId));

        const entradas = all
            .filter(f => f.tipo === 'entrada' && f.status === 'confirmado')
            .reduce((sum, f) => sum + Number(f.valor), 0);

        const saidas = all
            .filter(f => (f.tipo === 'saida' || f.tipo === 'financeiro') && f.status === 'confirmado')
            .reduce((sum, f) => sum + Number(f.valor), 0);

        return {
            entradas,
            saidas,
            saldo: entradas - saidas,
            total_lancamentos: all.length,
        };
    },
};
