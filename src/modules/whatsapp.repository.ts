import { eq, and, desc } from 'drizzle-orm';
import { db } from '../database/client';
import { conversas, mensagens, disparos, disparosDiarios, automacoes } from './whatsapp.db.schema';

export const whatsappRepository = {
    // ── CONVERSAS ──────────────────────────────────
    async findOrCreateConversa(userId: string, telefone: string, nome?: string) {
        const existing = await db.select().from(conversas)
            .where(and(eq(conversas.user_id, userId), eq(conversas.telefone, telefone)));

        if (existing[0]) return existing[0];

        const [nova] = await db.insert(conversas)
            .values({ user_id: userId, telefone, nome: nome ?? telefone })
            .returning();
        return nova;
    },

    async listConversas(userId: string, status?: string) {
        const all = await db.select().from(conversas)
            .where(eq(conversas.user_id, userId))
            .orderBy(desc(conversas.ultima_msg_em));
        return status ? all.filter(c => c.status === status) : all;
    },

    async updateConversa(id: string, userId: string, data: Record<string, unknown>) {
        const [c] = await db.update(conversas)
            .set({ ...data, updated_at: new Date() } as typeof conversas.$inferInsert)
            .where(and(eq(conversas.id, id), eq(conversas.user_id, userId)))
            .returning();
        return c ?? null;
    },

    // ── MENSAGENS ──────────────────────────────────
    async saveMensagem(data: {
        user_id: string;
        conversa_id: string;
        telefone: string;
        direcao: string;
        conteudo: string;
        tipo?: string;
        wam_id?: string;
    }) {
        const [msg] = await db.insert(mensagens).values(data).returning();
        return msg;
    },

    async listMensagens(conversaId: string, userId: string) {
        return db.select().from(mensagens)
            .where(and(eq(mensagens.conversa_id, conversaId), eq(mensagens.user_id, userId)))
            .orderBy(mensagens.created_at);
    },

    // ── DISPAROS ──────────────────────────────────
    async createDisparo(userId: string, data: Record<string, unknown>) {
        const [d] = await db.insert(disparos)
            .values({ ...data, user_id: userId } as typeof disparos.$inferInsert)
            .returning();
        return d;
    },

    async updateDisparo(id: string, userId: string, data: Record<string, unknown>) {
        const [d] = await db.update(disparos)
            .set({ ...data, updated_at: new Date() } as typeof disparos.$inferInsert)
            .where(and(eq(disparos.id, id), eq(disparos.user_id, userId)))
            .returning();
        return d ?? null;
    },

    async listDisparos(userId: string) {
        return db.select().from(disparos)
            .where(eq(disparos.user_id, userId))
            .orderBy(desc(disparos.created_at));
    },

    // Controle de limite diário
    async getLimiteDiario(userId: string): Promise<{ usado: number; limite: number; restante: number }> {
        const hoje = new Date().toISOString().split('T')[0];
        const result = await db.select().from(disparosDiarios)
            .where(and(eq(disparosDiarios.user_id, userId), eq(disparosDiarios.data, hoje)));

        const usado = result[0]?.quantidade ?? 0;
        return { usado, limite: 20, restante: Math.max(0, 20 - usado) };
    },

    async incrementarLimiteDiario(userId: string, quantidade: number) {
        const hoje = new Date().toISOString().split('T')[0];
        const existing = await db.select().from(disparosDiarios)
            .where(and(eq(disparosDiarios.user_id, userId), eq(disparosDiarios.data, hoje)));

        if (existing[0]) {
            await db.update(disparosDiarios)
                .set({ quantidade: (existing[0].quantidade ?? 0) + quantidade })
                .where(eq(disparosDiarios.id, existing[0].id));
        } else {
            await db.insert(disparosDiarios).values({ user_id: userId, data: hoje, quantidade });
        }
    },

    // ── AUTOMAÇÕES ──────────────────────────────────
    async listAutomacoes(userId: string) {
        return db.select().from(automacoes)
            .where(eq(automacoes.user_id, userId))
            .orderBy(desc(automacoes.created_at));
    },

    async findAutomacaoAtiva(userId: string) {
        const all = await db.select().from(automacoes)
            .where(and(eq(automacoes.user_id, userId), eq(automacoes.ativo, true)));
        return all[0] ?? null;
    },

    async createAutomacao(userId: string, data: Record<string, unknown>) {
        const [a] = await db.insert(automacoes)
            .values({ ...data, user_id: userId } as typeof automacoes.$inferInsert)
            .returning();
        return a;
    },

    async updateAutomacao(id: string, userId: string, data: Record<string, unknown>) {
        const [a] = await db.update(automacoes)
            .set({ ...data, updated_at: new Date() } as typeof automacoes.$inferInsert)
            .where(and(eq(automacoes.id, id), eq(automacoes.user_id, userId)))
            .returning();
        return a ?? null;
    },

    async deleteAutomacao(id: string, userId: string) {
        const [a] = await db.delete(automacoes)
            .where(and(eq(automacoes.id, id), eq(automacoes.user_id, userId)))
            .returning();
        return a ?? null;
    },
};