"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRepository = void 0;
const client_1 = require("../../database/client");
const shema_1 = require("../../database/shema");
const drizzle_orm_1 = require("drizzle-orm");
exports.adminRepository = {
    async listCorretores() {
        return client_1.db
            .select({
            id: shema_1.users.id,
            name: shema_1.users.name,
            email: shema_1.users.email,
            phone: shema_1.users.phone,
            tipo_conta: shema_1.users.tipo_conta,
            role: shema_1.users.role,
            organization_id: shema_1.users.organization_id,
            plano: shema_1.users.plano,
            plano_status: shema_1.users.plano_status,
            plano_expira_em: shema_1.users.plano_expira_em,
            created_at: shema_1.users.created_at,
        })
            .from(shema_1.users)
            .where((0, drizzle_orm_1.eq)(shema_1.users.tipo_conta, 'corretor'))
            .orderBy(shema_1.users.created_at);
    },
    async listTodosClientes() {
        const corretores = await client_1.db
            .select({
            id: shema_1.users.id,
            name: shema_1.users.name,
            email: shema_1.users.email,
            phone: shema_1.users.phone,
            tipo_conta: shema_1.users.tipo_conta,
            role: shema_1.users.role,
            organization_id: shema_1.users.organization_id,
            plano: shema_1.users.plano,
            plano_status: shema_1.users.plano_status,
            plano_expira_em: shema_1.users.plano_expira_em,
            created_at: shema_1.users.created_at,
        })
            .from(shema_1.users)
            .where((0, drizzle_orm_1.eq)(shema_1.users.tipo_conta, 'corretor'))
            .orderBy(shema_1.users.created_at);
        const imobiliarias = await client_1.db
            .select({
            id: shema_1.organizations.id,
            name: shema_1.organizations.name,
            email: shema_1.organizations.email,
            phone: shema_1.organizations.phone,
            plano: shema_1.organizations.plano,
            plano_status: shema_1.organizations.plano_status,
            plano_expira_em: shema_1.organizations.plano_expira_em,
            created_at: shema_1.organizations.created_at,
        })
            .from(shema_1.organizations)
            .orderBy(shema_1.organizations.created_at);
        return { corretores, imobiliarias };
    },
    async listImobiliarias() {
        return client_1.db
            .select({
            id: shema_1.organizations.id,
            name: shema_1.organizations.name,
            email: shema_1.organizations.email,
            phone: shema_1.organizations.phone,
            plano: shema_1.organizations.plano,
            plano_status: shema_1.organizations.plano_status,
            plano_expira_em: shema_1.organizations.plano_expira_em,
            created_at: shema_1.organizations.created_at,
        })
            .from(shema_1.organizations)
            .orderBy(shema_1.organizations.created_at);
    },
    async setUserPlan(userId, plano, expira_em) {
        const [updated] = await client_1.db
            .update(shema_1.users)
            .set({
            plano,
            plano_status: 'active',
            plano_expira_em: expira_em,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(shema_1.users.id, userId))
            .returning({ id: shema_1.users.id, name: shema_1.users.name, email: shema_1.users.email, plano: shema_1.users.plano, plano_expira_em: shema_1.users.plano_expira_em });
        return updated ?? null;
    },
    async setOrgPlan(orgId, plano, expira_em) {
        const [updated] = await client_1.db
            .update(shema_1.organizations)
            .set({
            plano,
            plano_status: 'active',
            plano_expira_em: expira_em,
            updated_at: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(shema_1.organizations.id, orgId))
            .returning({ id: shema_1.organizations.id, name: shema_1.organizations.name, plano: shema_1.organizations.plano, plano_expira_em: shema_1.organizations.plano_expira_em });
        return updated ?? null;
    },
    async deactivateUserPlan(userId) {
        const [updated] = await client_1.db
            .update(shema_1.users)
            .set({ plano: 'basic', plano_status: 'inactive', plano_expira_em: null, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(shema_1.users.id, userId))
            .returning({ id: shema_1.users.id, name: shema_1.users.name, plano: shema_1.users.plano });
        return updated ?? null;
    },
    async deactivateOrgPlan(orgId) {
        const [updated] = await client_1.db
            .update(shema_1.organizations)
            .set({ plano: 'basic', plano_status: 'inactive', plano_expira_em: null, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(shema_1.organizations.id, orgId))
            .returning({ id: shema_1.organizations.id, name: shema_1.organizations.name, plano: shema_1.organizations.plano });
        return updated ?? null;
    },
};
//# sourceMappingURL=admin.repository.js.map