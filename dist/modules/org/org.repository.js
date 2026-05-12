"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../database/client");
const org_db_schema_1 = require("./org.db.schema");
const auth_schema_1 = require("../auth/auth.schema");
const lead_db_schema_1 = require("../leads/lead.db.schema");
const venda_db_schema_1 = require("../vendas/venda.db.schema");
const visita_db_schema_1 = require("../visitas/visita.db.schema");
exports.orgRepository = {
    // ── ORGANIZATIONS ─────────────────────────────────────────────────────────
    async createOrg(data) {
        const [org] = await client_1.db.insert(org_db_schema_1.organizations).values(data).returning();
        return org;
    },
    async findOrgById(id) {
        const result = await client_1.db.select().from(org_db_schema_1.organizations).where((0, drizzle_orm_1.eq)(org_db_schema_1.organizations.id, id));
        return result[0] ?? null;
    },
    async updateOrg(id, data) {
        const [org] = await client_1.db.update(org_db_schema_1.organizations)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(org_db_schema_1.organizations.id, id))
            .returning();
        return org ?? null;
    },
    // ── MEMBROS ───────────────────────────────────────────────────────────────
    async listMembers(orgId) {
        return client_1.db.select({
            id: auth_schema_1.users.id,
            name: auth_schema_1.users.name,
            email: auth_schema_1.users.email,
            phone: auth_schema_1.users.phone,
            creci: auth_schema_1.users.creci,
            avatar_url: auth_schema_1.users.avatar_url,
            role: auth_schema_1.users.role,
            tipo_conta: auth_schema_1.users.tipo_conta,
            created_at: auth_schema_1.users.created_at,
        }).from(auth_schema_1.users).where((0, drizzle_orm_1.eq)(auth_schema_1.users.organization_id, orgId));
    },
    async removeMember(userId, orgId) {
        const [user] = await client_1.db.update(auth_schema_1.users)
            .set({ organization_id: null, role: 'owner', updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(auth_schema_1.users.id, userId), (0, drizzle_orm_1.eq)(auth_schema_1.users.organization_id, orgId)))
            .returning({ id: auth_schema_1.users.id });
        return user ?? null;
    },
    // ── INVITES ───────────────────────────────────────────────────────────────
    async createInvite(data) {
        const [invite] = await client_1.db.insert(org_db_schema_1.invites).values(data).returning();
        return invite;
    },
    async findInviteByToken(token) {
        const result = await client_1.db.select().from(org_db_schema_1.invites).where((0, drizzle_orm_1.eq)(org_db_schema_1.invites.token, token));
        return result[0] ?? null;
    },
    async listInvites(orgId) {
        return client_1.db.select().from(org_db_schema_1.invites)
            .where((0, drizzle_orm_1.eq)(org_db_schema_1.invites.organization_id, orgId));
    },
    async updateInviteStatus(id, status) {
        const [invite] = await client_1.db.update(org_db_schema_1.invites)
            .set({ status })
            .where((0, drizzle_orm_1.eq)(org_db_schema_1.invites.id, id))
            .returning();
        return invite ?? null;
    },
    // ── DASHBOARD DA EQUIPE ───────────────────────────────────────────────────
    async getTeamDashboard(orgId) {
        const memberRows = await client_1.db.select({
            id: auth_schema_1.users.id,
            name: auth_schema_1.users.name,
            email: auth_schema_1.users.email,
            avatar_url: auth_schema_1.users.avatar_url,
            creci: auth_schema_1.users.creci,
            role: auth_schema_1.users.role,
        }).from(auth_schema_1.users).where((0, drizzle_orm_1.eq)(auth_schema_1.users.organization_id, orgId));
        if (!memberRows.length) {
            return { members: [], totals: { leads: 0, vendas: 0, valor_total: '0.00', visitas: 0 } };
        }
        const memberIds = memberRows.map(m => m.id);
        const [leadCounts, vendaCounts, visitaCounts] = await Promise.all([
            client_1.db.select({ user_id: lead_db_schema_1.leads.user_id, total: (0, drizzle_orm_1.count)() })
                .from(lead_db_schema_1.leads).where((0, drizzle_orm_1.inArray)(lead_db_schema_1.leads.user_id, memberIds)).groupBy(lead_db_schema_1.leads.user_id),
            client_1.db.select({ user_id: venda_db_schema_1.vendas.user_id, total: (0, drizzle_orm_1.count)(), valor_total: (0, drizzle_orm_1.sum)(venda_db_schema_1.vendas.valor) })
                .from(venda_db_schema_1.vendas).where((0, drizzle_orm_1.inArray)(venda_db_schema_1.vendas.user_id, memberIds)).groupBy(venda_db_schema_1.vendas.user_id),
            client_1.db.select({ user_id: visita_db_schema_1.visitas.user_id, total: (0, drizzle_orm_1.count)() })
                .from(visita_db_schema_1.visitas).where((0, drizzle_orm_1.inArray)(visita_db_schema_1.visitas.user_id, memberIds)).groupBy(visita_db_schema_1.visitas.user_id),
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
    async getOrgPipeline(orgId) {
        const rows = await client_1.db.select({
            id: lead_db_schema_1.leads.id,
            name: lead_db_schema_1.leads.name,
            telefone: lead_db_schema_1.leads.telefone,
            email: lead_db_schema_1.leads.email,
            temperatura: lead_db_schema_1.leads.temperatura,
            status: lead_db_schema_1.leads.status,
            interesse: lead_db_schema_1.leads.interesse,
            created_at: lead_db_schema_1.leads.created_at,
            corretor_id: auth_schema_1.users.id,
            corretor_name: auth_schema_1.users.name,
        })
            .from(lead_db_schema_1.leads)
            .innerJoin(auth_schema_1.users, (0, drizzle_orm_1.eq)(lead_db_schema_1.leads.user_id, auth_schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(auth_schema_1.users.organization_id, orgId))
            .orderBy(lead_db_schema_1.leads.created_at);
        return {
            novo_cliente: rows.filter(l => l.status === 'novo_cliente'),
            em_contato: rows.filter(l => l.status === 'em_contato'),
            visita_marcada: rows.filter(l => l.status === 'visita_marcada'),
            proposta_enviada: rows.filter(l => l.status === 'proposta_enviada'),
            cliente_desistiu: rows.filter(l => l.status === 'cliente_desistiu'),
        };
    },
    // ── TODOS OS LEADS DA ORG ────────────────────────────────────────────────
    async listOrgLeads(orgId) {
        return client_1.db.select({
            id: lead_db_schema_1.leads.id,
            name: lead_db_schema_1.leads.name,
            telefone: lead_db_schema_1.leads.telefone,
            email: lead_db_schema_1.leads.email,
            temperatura: lead_db_schema_1.leads.temperatura,
            status: lead_db_schema_1.leads.status,
            interesse: lead_db_schema_1.leads.interesse,
            created_at: lead_db_schema_1.leads.created_at,
            corretor_id: auth_schema_1.users.id,
            corretor_name: auth_schema_1.users.name,
        })
            .from(lead_db_schema_1.leads)
            .innerJoin(auth_schema_1.users, (0, drizzle_orm_1.eq)(lead_db_schema_1.leads.user_id, auth_schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(auth_schema_1.users.organization_id, orgId))
            .orderBy(lead_db_schema_1.leads.created_at);
    },
    // ── TODAS AS VENDAS DA ORG ───────────────────────────────────────────────
    async listOrgVendas(orgId) {
        return client_1.db.select({
            id: venda_db_schema_1.vendas.id,
            tipo: venda_db_schema_1.vendas.tipo,
            status: venda_db_schema_1.vendas.status,
            valor: venda_db_schema_1.vendas.valor,
            data_venda: venda_db_schema_1.vendas.data_venda,
            created_at: venda_db_schema_1.vendas.created_at,
            corretor_id: auth_schema_1.users.id,
            corretor_name: auth_schema_1.users.name,
        })
            .from(venda_db_schema_1.vendas)
            .innerJoin(auth_schema_1.users, (0, drizzle_orm_1.eq)(venda_db_schema_1.vendas.user_id, auth_schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(auth_schema_1.users.organization_id, orgId))
            .orderBy(venda_db_schema_1.vendas.created_at);
    },
};
//# sourceMappingURL=org.repository.js.map