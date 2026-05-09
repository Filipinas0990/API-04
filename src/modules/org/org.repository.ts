import { eq, and } from 'drizzle-orm';
import { db } from '../../database/client';
import { organizations, invites } from './org.db.schema';
import { users } from '../auth/auth.schema';

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
};
