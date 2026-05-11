import { eq, and, inArray, count, sum } from 'drizzle-orm';
import { db } from '../../database/client';
import { organizations, invites } from './org.db.schema';
import { users } from '../auth/auth.schema';
import { leads } from '../leads/lead.db.schema';
import { vendas } from '../vendas/venda.db.schema';
import { visitas } from '../visitas/visita.db.schema';

export const orgRepository = {

    // ── ORGANIZATIONS ─────────────────────────────────────────────────────────

    async createOrg(data: { name: string; email?: string; phone?: string }) {
        const [org] = await db.insert(organizations).values(data).returning();
        return org;
    },

    async findOrgById(id: string) {
        const result = await db.select().from(organizations).where(eq(organizations.id, id));
        return result[0] ?? null;
    },

    async updateOrg(id: string, data: { name?: string; email?: string; phone?: string; logo_url?: string }) {
        const [org] = await db.update(organizations)
            .set({ ...data, updated_at: new Date() })
            .where(eq(organizations.id, id))
            .returning();
        return org ?? null;
    },

    // ── MEMBROS ───────────────────────────────────────────────────────────────

    async listMembers(orgId: string) {
        return db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            creci: users.creci,
            avatar_url: users.avatar_url,
            role: users.role,
            tipo_conta: users.tipo_conta,
            created_at: users.created_at,
        }).from(users).where(eq(users.organization_id, orgId));
    },

    async removeMember(userId: string, orgId: string) {
        const [user] = await db.update(users)
            .set({ organization_id: null, role: 'owner', updated_at: new Date() })
            .where(and(eq(users.id, userId), eq(users.organization_id, orgId)))
            .returning({ id: users.id });
        return user ?? null;
    },

    // ── INVITES ───────────────────────────────────────────────────────────────

    async createInvite(data: { organization_id: string; email: string; token: string; expires_at: Date }) {
        const [invite] = await db.insert(invites).values(data).returning();
        return invite;
    },

    async findInviteByToken(token: string) {
        const result = await db.select().from(invites).where(eq(invites.token, token));
        return result[0] ?? null;
    },

    async listInvites(orgId: string) {
        return db.select().from(invites)
            .where(eq(invites.organization_id, orgId));
    },

    async updateInviteStatus(id: string, status: string) {
        const [invite] = await db.update(invites)
            .set({ status })
            .where(eq(invites.id, id))
            .returning();
        return invite ?? null;
    },

    // ── DASHBOARD DA EQUIPE ───────────────────────────────────────────────────

    async getTeamDashboard(orgId: string) {
        const memberRows = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatar_url: users.avatar_url,
            creci: users.creci,
            role: users.role,
        }).from(users).where(eq(users.organization_id, orgId));

        if (!memberRows.length) {
            return { members: [], totals: { leads: 0, vendas: 0, valor_total: '0.00', visitas: 0 } };
        }

        const memberIds = memberRows.map(m => m.id);

        const [leadCounts, vendaCounts, visitaCounts] = await Promise.all([
            db.select({ user_id: leads.user_id, total: count() })
                .from(leads).where(inArray(leads.user_id, memberIds)).groupBy(leads.user_id),

            db.select({ user_id: vendas.user_id, total: count(), valor_total: sum(vendas.valor) })
                .from(vendas).where(inArray(vendas.user_id, memberIds)).groupBy(vendas.user_id),

            db.select({ user_id: visitas.user_id, total: count() })
                .from(visitas).where(inArray(visitas.user_id, memberIds)).groupBy(visitas.user_id),
        ]);

        const leadMap = Object.fromEntries(leadCounts.map(r => [r.user_id, Number(r.total)]));
        const vendaMap = Object.fromEntries(vendaCounts.map(r => [r.user_id, { total: Number(r.total), valor: r.valor_total ?? '0' }]));
        const visitaMap = Object.fromEntries(visitaCounts.map(r => [r.user_id, Number(r.total)]));

        const members = memberRows.map(m => ({
            ...m,
            leads: leadMap[m.id] ?? 0,
            vendas: vendaMap[m.id]?.total ?? 0,
            valor_vendas: vendaMap[m.id]?.valor ?? '0',
            visitas: visitaMap[m.id] ?? 0,
        })).sort((a, b) => parseFloat(b.valor_vendas) - parseFloat(a.valor_vendas));

        const totals = {
            leads: members.reduce((acc, m) => acc + m.leads, 0),
            vendas: members.reduce((acc, m) => acc + m.vendas, 0),
            valor_total: members.reduce((acc, m) => acc + parseFloat(m.valor_vendas), 0).toFixed(2),
            visitas: members.reduce((acc, m) => acc + m.visitas, 0),
        };

        return { members, totals };
    },

    // ── PIPELINE CONSOLIDADO ─────────────────────────────────────────────────

    async getOrgPipeline(orgId: string) {
        const rows = await db.select({
            id: leads.id,
            name: leads.name,
            telefone: leads.telefone,
            email: leads.email,
            temperatura: leads.temperatura,
            status: leads.status,
            interesse: leads.interesse,
            created_at: leads.created_at,
            corretor_id: users.id,
            corretor_name: users.name,
        })
        .from(leads)
        .innerJoin(users, eq(leads.user_id, users.id))
        .where(eq(users.organization_id, orgId))
        .orderBy(leads.created_at);

        return {
            novo_cliente: rows.filter(l => l.status === 'novo_cliente'),
            em_contato: rows.filter(l => l.status === 'em_contato'),
            visita_marcada: rows.filter(l => l.status === 'visita_marcada'),
            proposta_enviada: rows.filter(l => l.status === 'proposta_enviada'),
            cliente_desistiu: rows.filter(l => l.status === 'cliente_desistiu'),
        };
    },

    // ── TODOS OS LEADS DA ORG ────────────────────────────────────────────────

    async listOrgLeads(orgId: string) {
        return db.select({
            id: leads.id,
            name: leads.name,
            telefone: leads.telefone,
            email: leads.email,
            temperatura: leads.temperatura,
            status: leads.status,
            interesse: leads.interesse,
            created_at: leads.created_at,
            corretor_id: users.id,
            corretor_name: users.name,
        })
        .from(leads)
        .innerJoin(users, eq(leads.user_id, users.id))
        .where(eq(users.organization_id, orgId))
        .orderBy(leads.created_at);
    },

    // ── TODAS AS VENDAS DA ORG ───────────────────────────────────────────────

    async listOrgVendas(orgId: string) {
        return db.select({
            id: vendas.id,
            tipo: vendas.tipo,
            status: vendas.status,
            valor: vendas.valor,
            data_venda: vendas.data_venda,
            created_at: vendas.created_at,
            corretor_id: users.id,
            corretor_name: users.name,
        })
        .from(vendas)
        .innerJoin(users, eq(vendas.user_id, users.id))
        .where(eq(users.organization_id, orgId))
        .orderBy(vendas.created_at);
    },
};
