export interface JwtPayload {
    sub: string;
    role: string;
    tipo_conta: string;
    organization_id: string | null;
}
export declare function signAccessToken(userId: string, extra?: {
    role?: string;
    tipo_conta?: string;
    organization_id?: string | null;
}): string;
export declare function signRefreshToken(userId: string): string;
export declare function verifyAccessToken(token: string): JwtPayload | null;
export declare function verifyRefreshToken(token: string): JwtPayload | null;
//# sourceMappingURL=jwt.d.ts.map