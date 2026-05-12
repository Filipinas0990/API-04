export declare const orgRepository: {
    createOrg(data: {
        name: string;
        email?: string;
        phone?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        logo_url: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
    findOrgById(id: string): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        logo_url: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
    updateOrg(id: string, data: {
        name?: string;
        email?: string;
        phone?: string;
        logo_url?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        logo_url: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
    listMembers(orgId: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        creci: string | null;
        avatar_url: string | null;
        role: string | null;
        tipo_conta: string | null;
        created_at: Date | null;
    }[]>;
    removeMember(userId: string, orgId: string): Promise<{
        id: string;
    }>;
    createInvite(data: {
        organization_id: string;
        email: string;
        token: string;
        expires_at: Date;
    }): Promise<{
        id: string;
        email: string;
        created_at: Date | null;
        organization_id: string;
        token: string;
        status: string | null;
        expires_at: Date;
    }>;
    findInviteByToken(token: string): Promise<{
        id: string;
        organization_id: string;
        email: string;
        token: string;
        status: string | null;
        expires_at: Date;
        created_at: Date | null;
    }>;
    listInvites(orgId: string): Promise<{
        id: string;
        organization_id: string;
        email: string;
        token: string;
        status: string | null;
        expires_at: Date;
        created_at: Date | null;
    }[]>;
    updateInviteStatus(id: string, status: string): Promise<{
        id: string;
        organization_id: string;
        email: string;
        token: string;
        status: string | null;
        expires_at: Date;
        created_at: Date | null;
    }>;
    getTeamDashboard(orgId: string): Promise<{
        members: {
            leads: number;
            vendas: number;
            valor_vendas: string;
            visitas: number;
            id: string;
            name: string;
            email: string;
            avatar_url: string | null;
            creci: string | null;
            role: string | null;
        }[];
        totals: {
            leads: number;
            vendas: number;
            valor_total: string;
            visitas: number;
        };
    }>;
    getOrgPipeline(orgId: string): Promise<{
        novo_cliente: {
            id: string;
            name: string;
            telefone: string;
            email: string | null;
            temperatura: number | null;
            status: string | null;
            interesse: string | null;
            created_at: Date | null;
            corretor_id: string;
            corretor_name: string;
        }[];
        em_contato: {
            id: string;
            name: string;
            telefone: string;
            email: string | null;
            temperatura: number | null;
            status: string | null;
            interesse: string | null;
            created_at: Date | null;
            corretor_id: string;
            corretor_name: string;
        }[];
        visita_marcada: {
            id: string;
            name: string;
            telefone: string;
            email: string | null;
            temperatura: number | null;
            status: string | null;
            interesse: string | null;
            created_at: Date | null;
            corretor_id: string;
            corretor_name: string;
        }[];
        proposta_enviada: {
            id: string;
            name: string;
            telefone: string;
            email: string | null;
            temperatura: number | null;
            status: string | null;
            interesse: string | null;
            created_at: Date | null;
            corretor_id: string;
            corretor_name: string;
        }[];
        cliente_desistiu: {
            id: string;
            name: string;
            telefone: string;
            email: string | null;
            temperatura: number | null;
            status: string | null;
            interesse: string | null;
            created_at: Date | null;
            corretor_id: string;
            corretor_name: string;
        }[];
    }>;
    listOrgLeads(orgId: string): Promise<{
        id: string;
        name: string;
        telefone: string;
        email: string | null;
        temperatura: number | null;
        status: string | null;
        interesse: string | null;
        created_at: Date | null;
        corretor_id: string;
        corretor_name: string;
    }[]>;
    listOrgVendas(orgId: string): Promise<{
        id: string;
        tipo: string | null;
        status: string | null;
        valor: string;
        data_venda: string | null;
        created_at: Date | null;
        corretor_id: string;
        corretor_name: string;
    }[]>;
};
//# sourceMappingURL=org.repository.d.ts.map