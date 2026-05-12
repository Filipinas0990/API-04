export declare const authRepository: {
    findByEmail(email: string): Promise<{
        id: string;
        name: string;
        email: string;
        password: string;
        phone: string | null;
        creci: string | null;
        avatar_url: string | null;
        tipo_conta: string | null;
        role: string | null;
        organization_id: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        creci: string | null;
        avatar_url: string | null;
        role: string | null;
        tipo_conta: string | null;
        organization_id: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
    create(data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        creci?: string;
        tipo_conta?: string;
        role?: string;
        organization_id?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        creci: string | null;
        avatar_url: string | null;
        role: string | null;
        tipo_conta: string | null;
        organization_id: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
    update(id: string, data: {
        name?: string;
        phone?: string;
        creci?: string;
        avatar_url?: string;
        role?: string;
        organization_id?: string | null;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        creci: string | null;
        avatar_url: string | null;
        role: string | null;
        tipo_conta: string | null;
        organization_id: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
    saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>;
    findRefreshToken(token: string): Promise<{
        id: string;
        user_id: string;
        token: string;
        expires_at: Date;
        created_at: Date | null;
    }>;
    deleteRefreshToken(token: string): Promise<void>;
    deleteAllRefreshTokens(userId: string): Promise<void>;
    updatePassword(id: string, hashedPassword: string): Promise<void>;
};
//# sourceMappingURL=auth.repository.d.ts.map