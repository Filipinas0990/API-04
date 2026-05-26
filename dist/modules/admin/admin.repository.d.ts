import type { Plano } from '../../config/plans';
export declare const adminRepository: {
    listCorretores(): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        tipo_conta: string | null;
        role: string | null;
        organization_id: string | null;
        plano: string | null;
        plano_status: string | null;
        plano_expira_em: Date | null;
        created_at: Date | null;
    }[]>;
    listTodosClientes(): Promise<{
        corretores: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            tipo_conta: string | null;
            role: string | null;
            organization_id: string | null;
            plano: string | null;
            plano_status: string | null;
            plano_expira_em: Date | null;
            created_at: Date | null;
        }[];
        imobiliarias: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            plano: string | null;
            plano_status: string | null;
            plano_expira_em: Date | null;
            created_at: Date | null;
        }[];
    }>;
    listImobiliarias(): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        plano: string | null;
        plano_status: string | null;
        plano_expira_em: Date | null;
        created_at: Date | null;
    }[]>;
    setUserPlan(userId: string, plano: Plano, expira_em: Date | null): Promise<{
        id: string;
        name: string;
        email: string;
        plano: string | null;
        plano_expira_em: Date | null;
    }>;
    setOrgPlan(orgId: string, plano: Plano, expira_em: Date | null): Promise<{
        id: string;
        name: string;
        plano: string | null;
        plano_expira_em: Date | null;
    }>;
    deactivateUserPlan(userId: string): Promise<{
        id: string;
        name: string;
        plano: string | null;
    }>;
    deactivateOrgPlan(orgId: string): Promise<{
        id: string;
        name: string;
        plano: string | null;
    }>;
};
//# sourceMappingURL=admin.repository.d.ts.map