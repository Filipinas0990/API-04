import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../database/client';
import { metas } from './meta.db.schema';

type MetaTipo = 'novos_clientes' | 'visitas' | 'propostas';

async function calcularProgresso(tipo: MetaTipo, userId: string, dataInicio: string, dataFim: string): Promise<number> {
    if (tipo === 'novos_clientes') {
        const rows = await db.execute(sql`
            SELECT COUNT(*)::int AS count FROM leads
            WHERE user_id = ${userId}::uuid
            AND created_at::date >= ${dataInicio}::date
            AND created_at::date <= ${dataFim}::date
        `);
        return ((rows as unknown) as { count: number }[])[0]?.count ?? 0;
    }

    if (tipo === 'visitas') {
        const rows = await db.execute(sql`
            SELECT COUNT(*)::int AS count FROM visitas
            WHERE user_id = ${userId}::uuid
            AND created_at::date >= ${dataInicio}::date
            AND created_at::date <= ${dataFim}::date
        `);
        return ((rows as unknown) as { count: number }[])[0]?.count ?? 0;
    }

    if (tipo === 'propostas') {
        const rows = await db.execute(sql`
            SELECT COUNT(*)::int AS count FROM leads
            WHERE user_id = ${userId}::uuid
            AND status = 'proposta_enviada'
            AND updated_at::date >= ${dataInicio}::date
            AND updated_at::date <= ${dataFim}::date
        `);
        return ((rows as unknown) as { count: number }[])[0]?.count ?? 0;
    }

    return 0;
}

export const metaRepository = {
    async findAll(userId: string) {
        const all = await db
            .select()
            .from(metas)
            .where(eq(metas.user_id, userId))
            .orderBy(metas.created_at);

        return Promise.all(
            all.map(async (meta) => {
                const progresso = await calcularProgresso(
                    meta.tipo as MetaTipo,
                    userId,
                    meta.data_inicio,
                    meta.data_fim,
                );
                const percentual = meta.valor_alvo > 0
                    ? Math.min(100, Math.round((progresso / meta.valor_alvo) * 100))
                    : 0;
                return { ...meta, progresso, percentual };
            }),
        );
    },

    async create(userId: string, data: { tipo: string; valor_alvo: number; data_inicio: string; data_fim: string }) {
        const [meta] = await db
            .insert(metas)
            .values({ ...data, user_id: userId })
            .returning();
        return meta;
    },

    async update(id: string, userId: string, data: Partial<{ tipo: string; valor_alvo: number; data_inicio: string; data_fim: string }>) {
        const [meta] = await db
            .update(metas)
            .set({ ...data, updated_at: new Date() })
            .where(and(eq(metas.id, id), eq(metas.user_id, userId)))
            .returning();
        return meta ?? null;
    },

    async delete(id: string, userId: string) {
        const [meta] = await db
            .delete(metas)
            .where(and(eq(metas.id, id), eq(metas.user_id, userId)))
            .returning();
        return meta ?? null;
    },
};
