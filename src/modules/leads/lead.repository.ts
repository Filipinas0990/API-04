import { eq, and, ilike, or } from 'drizzle-orm';
import { db } from '../../database/client';
import { leads } from './lead.db.schema';

export const leadRepository = {
    // Listar todos os leads do usuário (com filtros opcionais)
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

        // Filtro de busca em memória (nome ou telefone)
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            return allLeads.filter(
                l =>
                    l.name.toLowerCase().includes(search) ||
                    l.telefone.includes(search) ||
                    (l.email?.toLowerCase().includes(search) ?? false)
            );
        }

        return allLeads;
    },

    // Buscar lead por ID (garante que pertence ao usuário)
    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(leads)
            .where(and(eq(leads.id, id), eq(leads.user_id, userId)));
        return result[0] ?? null;
    },

    // Criar lead
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

    // Atualizar lead
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

    // Deletar lead
    async delete(id: string, userId: string) {
        const [lead] = await db
            .delete(leads)
            .where(and(eq(leads.id, id), eq(leads.user_id, userId)))
            .returning();
        return lead ?? null;
    },

    // Pipeline: leads agrupados por status
    async getPipeline(userId: string) {
        const allLeads = await db
            .select()
            .from(leads)
            .where(eq(leads.user_id, userId))
            .orderBy(leads.created_at);

        return {
            novo_cliente: allLeads.filter(l => l.status === 'novo_cliente'),
            em_contato: allLeads.filter(l => l.status === 'em_contato'),
            visita_marcada: allLeads.filter(l => l.status === 'visita_marcada'),
            proposta_enviada: allLeads.filter(l => l.status === 'proposta_enviada'),
            cliente_desistiu: allLeads.filter(l => l.status === 'cliente_desistiu'),
        };
    },
};