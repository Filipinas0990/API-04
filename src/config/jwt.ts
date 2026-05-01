import jwt from 'jsonwebtoken';
import { env } from './env';

export interface JwtPayload {
    sub: string;
}

export function signAccessToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.JWT_SECRET, {
        expiresIn: '15m',
    });
}

export function signRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.REFRESH_SECRET, {
        expiresIn: '7d',
    });
}

export function verifyAccessToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, env.REFRESH_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}