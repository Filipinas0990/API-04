import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../database/client';
import { vendas } from './venda.db.schema';

export const vendaRepository = {
    async findAll(userId: string, filters?: { status?: string; tipo?: string }) {
        const all = await db
            .select()
            .from(vendas)
            .where(eq(vendas.user_id, userId))
            .orderBy(desc(vendas.created_at));

        let result = all;
        if (filters?.status) result = result.filter(v => v.status === filters.status);
        if (filters?.tipo) result = result.filter(v => v.tipo === filters.tipo);

        return result;
    },

    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(vendas)
            .where(and(eq(vendas.id, id), eq(vendas.user_id, userId)));
        return result[0] ?? null;
    },

    async create(userId: string, data: Record<string, unknown>) {
        const [venda] = await db
            .insert(vendas)
            .values({ ...data, user_id: userId } as typeof vendas.$inferInsert)
            .returning();
        return venda;
    },

    async update(id: string, userId: string, data: Record<string, unknown>) {
        const [venda] = await db
            .update(vendas)
            .set({ ...data, updated_at: new Date() } as typeof vendas.$inferInsert)
            .where(and(eq(vendas.id, id), eq(vendas.user_id, userId)))
            .returning();
        return venda ?? null;
    },

    async delete(id: string, userId: string) {
        const [venda] = await db
            .delete(vendas)
            .where(and(eq(vendas.id, id), eq(vendas.user_id, userId)))
            .returning();
        return venda ?? null;
    },

    // Resumo financeiro: total de vendas concluídas
    async getResumo(userId: string) {
        const todas = await db
            .select()
            .from(vendas)
            .where(eq(vendas.user_id, userId));

        const concluidas = todas.filter(v => v.status === 'Concluída');
        const totalVendas = concluidas.reduce((sum, v) => sum + Number(v.valor), 0);
        const totalComissao = concluidas.reduce((sum, v) => {
            const comissao = (Number(v.valor) * Number(v.base_calculo_pct)) / 100;
            const imposto = (comissao * Number(v.percentual_imposto)) / 100;
            return sum + comissao - imposto;
        }, 0);

        return {
            total_vendas: todas.length,
            vendas_concluidas: concluidas.length,
            valor_total: totalVendas,
            comissao_total: totalComissao,
            por_status: {
                em_negociacao: todas.filter(v => v.status === 'Em negociação').length,
                proposta_enviada: todas.filter(v => v.status === 'Proposta enviada').length,
                contrato_assinado: todas.filter(v => v.status === 'Contrato assinado').length,
                concluida: concluidas.length,
                cancelada: todas.filter(v => v.status === 'Cancelada').length,
            }
        };
    },
};