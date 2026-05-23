import { db } from '../../database/client';
import { users, organizations } from '../../database/shema';
import { eq, isNull, isNotNull } from 'drizzle-orm';
import type { Plano } from '../../config/plans';

export const adminRepository = {

    async listCorretores() {
        return db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                tipo_conta: users.tipo_conta,
                role: users.role,
                organization_id: users.organization_id,
                plano: users.plano,
                plano_status: users.plano_status,
                plano_expira_em: users.plano_expira_em,
                created_at: users.created_at,
            })
            .from(users)
            .where(eq(users.tipo_conta, 'corretor'))
            .orderBy(users.created_at);
    },

    async listTodosClientes() {
        const corretores = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                tipo_conta: users.tipo_conta,
                role: users.role,
                organization_id: users.organization_id,
                plano: users.plano,
                plano_status: users.plano_status,
                plano_expira_em: users.plano_expira_em,
                created_at: users.created_at,
            })
            .from(users)
            .where(eq(users.tipo_conta, 'corretor'))
            .orderBy(users.created_at);

        const imobiliarias = await db
            .select({
                id: organizations.id,
                name: organizations.name,
                email: organizations.email,
                phone: organizations.phone,
                plano: organizations.plano,
                plano_status: organizations.plano_status,
                plano_expira_em: organizations.plano_expira_em,
                created_at: organizations.created_at,
            })
            .from(organizations)
            .orderBy(organizations.created_at);

        return { corretores, imobiliarias };
    },

    async listImobiliarias() {
        return db
            .select({
                id: organizations.id,
                name: organizations.name,
                email: organizations.email,
                phone: organizations.phone,
                plano: organizations.plano,
                plano_status: organizations.plano_status,
                plano_expira_em: organizations.plano_expira_em,
                created_at: organizations.created_at,
            })
            .from(organizations)
            .orderBy(organizations.created_at);
    },

    async setUserPlan(userId: string, plano: Plano, expira_em: Date | null) {
        const [updated] = await db
            .update(users)
            .set({
                plano,
                plano_status: 'active',
                plano_expira_em: expira_em,
                updated_at: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({ id: users.id, name: users.name, email: users.email, plano: users.plano, plano_expira_em: users.plano_expira_em });

        return updated ?? null;
    },

    async setOrgPlan(orgId: string, plano: Plano, expira_em: Date | null) {
        const [updated] = await db
            .update(organizations)
            .set({
                plano,
                plano_status: 'active',
                plano_expira_em: expira_em,
                updated_at: new Date(),
            })
            .where(eq(organizations.id, orgId))
            .returning({ id: organizations.id, name: organizations.name, plano: organizations.plano, plano_expira_em: organizations.plano_expira_em });

        return updated ?? null;
    },

    async deactivateUserPlan(userId: string) {
        const [updated] = await db
            .update(users)
            .set({ plano: 'basic', plano_status: 'inactive', plano_expira_em: null, updated_at: new Date() })
            .where(eq(users.id, userId))
            .returning({ id: users.id, name: users.name, plano: users.plano });

        return updated ?? null;
    },

    async deactivateOrgPlan(orgId: string) {
        const [updated] = await db
            .update(organizations)
            .set({ plano: 'basic', plano_status: 'inactive', plano_expira_em: null, updated_at: new Date() })
            .where(eq(organizations.id, orgId))
            .returning({ id: organizations.id, name: organizations.name, plano: organizations.plano });

        return updated ?? null;
    },
};
