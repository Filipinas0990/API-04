import { eq, and } from 'drizzle-orm';
import { db } from '../../database/client';
import { leads } from './lead.db.schema';
import { etiquetaRepository } from '../etiquetas/etiqueta.repository';

async function withEtiquetas<T extends { id: string }>(items: T[]) {
    const map = await etiquetaRepository.fetchForLeads(items.map(i => i.id));
    return items.map(item => ({ ...item, etiquetas: map.get(item.id) ?? [] }));
}

export const leadRepository = {
    async findAll(userId: string, filters?: { search?: string; status?: string }) {
        const conditions = [eq(leads.user_id, userId)];

        if (filters?.status) {
            conditions.push(eq(leads.status, filters.status));
        }

        const allLeads = await db
            .select()
            .from(leads)
            .where(and(...conditions))
            .orderBy(leads.created_at);

        const filtered = filters?.search
            ? (() => {
                const search = filters.search!.toLowerCase();
                return allLeads.filter(
                    l =>
                        l.name.toLowerCase().includes(search) ||
                        l.telefone.includes(search) ||
                        (l.email?.toLowerCase().includes(search) ?? false),
                );
            })()
            : allLeads;

        return withEtiquetas(filtered);
    },

    async findByPhone(userId: string, telefone: string) {
        const result = await db
            .select()
            .from(leads)
            .where(and(eq(leads.user_id, userId), eq(leads.telefone, telefone)));
        return result[0] ?? null;
    },

    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(leads)
            .where(and(eq(leads.id, id), eq(leads.user_id, userId)));
        if (!result[0]) return null;
        const [enriched] = await withEtiquetas([result[0]]);
        return enriched;
    },

    async create(userId: string, data: {
        name: string;
        telefone: string;
        email?: string;
        gestor_responsavel?: string;
        temperatura?: number;
        interesse?: string;
        observacoes?: string;
        status?: string;
    }) {
        const [lead] = await db
            .insert(leads)
            .values({ ...data, user_id: userId })
            .returning();
        return lead;
    },

    async update(id: string, userId: string, data: Partial<{
        name: string;
        telefone: string;
        email: string;
        gestor_responsavel: string;
        temperatura: number;
        interesse: string;
        observacoes: string;
        status: string;
    }>) {
        const [lead] = await db
            .update(leads)
            .set({ ...data, updated_at: new Date() })
            .where(and(eq(leads.id, id), eq(leads.user_id, userId)))
            .returning();
        return lead ?? null;
    },

    async delete(id: string, userId: string) {
        const [lead] = await db
            .delete(leads)
            .where(and(eq(leads.id, id), eq(leads.user_id, userId)))
            .returning();
        return lead ?? null;
    },

    async findByKanbanEtapa(userId: string, etapa: string) {
        return db
            .select()
            .from(leads)
            .where(and(eq(leads.user_id, userId), eq(leads.status, etapa)))
            .orderBy(leads.created_at);
    },

    async getPipeline(userId: string) {
        const allLeads = await db
            .select()
            .from(leads)
            .where(eq(leads.user_id, userId))
            .orderBy(leads.created_at);

        const enriched = await withEtiquetas(allLeads);

        return {
            novo_cliente: enriched.filter(l => l.status === 'novo_cliente'),
            em_contato: enriched.filter(l => l.status === 'em_contato'),
            visita_marcada: enriched.filter(l => l.status === 'visita_marcada'),
            proposta_enviada: enriched.filter(l => l.status === 'proposta_enviada'),
            cliente_desistiu: enriched.filter(l => l.status === 'cliente_desistiu'),
        };
    },
};
