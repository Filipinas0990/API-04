import { eq, and, inArray, sql } from 'drizzle-orm';
import { db } from '../../database/client';
import { etiquetas, leadEtiquetas } from './etiqueta.db.schema';

export const etiquetaRepository = {
    async findAll(userId: string) {
        return db
            .select()
            .from(etiquetas)
            .where(eq(etiquetas.user_id, userId))
            .orderBy(etiquetas.created_at);
    },

    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(etiquetas)
            .where(and(eq(etiquetas.id, id), eq(etiquetas.user_id, userId)));
        return result[0] ?? null;
    },

    async create(userId: string, data: {
        name: string;
        color: string;
        icon: string;
        keyword_trigger?: string;
        keyword_type: string;
    }) {
        const [etiqueta] = await db
            .insert(etiquetas)
            .values({ ...data, user_id: userId })
            .returning();
        return etiqueta;
    },

    async update(id: string, userId: string, data: Partial<{
        name: string;
        color: string;
        icon: string;
        keyword_trigger: string;
        keyword_type: string;
    }>) {
        const [etiqueta] = await db
            .update(etiquetas)
            .set({ ...data, updated_at: new Date() })
            .where(and(eq(etiquetas.id, id), eq(etiquetas.user_id, userId)))
            .returning();
        return etiqueta ?? null;
    },

    async delete(id: string, userId: string) {
        const [etiqueta] = await db
            .delete(etiquetas)
            .where(and(eq(etiquetas.id, id), eq(etiquetas.user_id, userId)))
            .returning();
        return etiqueta ?? null;
    },

    async addToLead(leadId: string, etiquetaId: string) {
        await db
            .insert(leadEtiquetas)
            .values({ lead_id: leadId, etiqueta_id: etiquetaId })
            .onConflictDoNothing();
    },

    async removeFromLead(leadId: string, etiquetaId: string) {
        await db
            .delete(leadEtiquetas)
            .where(
                and(
                    eq(leadEtiquetas.lead_id, leadId),
                    eq(leadEtiquetas.etiqueta_id, etiquetaId),
                ),
            );
    },

    async fetchForLeads(leadIds: string[]) {
        if (leadIds.length === 0) {
            return new Map<string, { id: string; name: string; color: string; icon: string }[]>();
        }

        const rows = await db
            .select({
                lead_id: leadEtiquetas.lead_id,
                id: etiquetas.id,
                name: etiquetas.name,
                color: etiquetas.color,
                icon: etiquetas.icon,
            })
            .from(leadEtiquetas)
            .innerJoin(etiquetas, eq(leadEtiquetas.etiqueta_id, etiquetas.id))
            .where(inArray(leadEtiquetas.lead_id, leadIds));

        const map = new Map<string, { id: string; name: string; color: string; icon: string }[]>();
        for (const row of rows) {
            const { lead_id, ...tag } = row;
            if (!map.has(lead_id)) map.set(lead_id, []);
            map.get(lead_id)!.push(tag);
        }
        return map;
    },

    async findWithKeywords(userId: string) {
        return db
            .select()
            .from(etiquetas)
            .where(
                and(
                    eq(etiquetas.user_id, userId),
                    sql`${etiquetas.keyword_trigger} IS NOT NULL`,
                ),
            );
    },

    async getStats(userId: string) {
        const allEtiquetas = await db
            .select()
            .from(etiquetas)
            .where(eq(etiquetas.user_id, userId))
            .orderBy(etiquetas.created_at);

        const today = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const days: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }

        const result = await Promise.all(
            allEtiquetas.map(async (e) => {
                const rows = await db.execute(sql`
                    SELECT
                        TO_CHAR(le.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS date,
                        COUNT(*)::int AS count
                    FROM lead_etiquetas le
                    WHERE le.etiqueta_id = ${e.id}
                        AND le.created_at >= NOW() - INTERVAL '7 days'
                    GROUP BY TO_CHAR(le.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
                `);

                const countsMap = new Map<string, number>();
                for (const row of (rows as unknown) as { date: string; count: number }[]) {
                    countsMap.set(row.date, Number(row.count));
                }

                const series = days.map(date => ({ date, count: countsMap.get(date) ?? 0 }));
                const total_leads = series.reduce((sum, s) => sum + s.count, 0);

                return { etiqueta_id: e.id, name: e.name, color: e.color, total_leads, series };
            }),
        );

        return result;
    },
};
