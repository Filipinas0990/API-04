import { config } from 'dotenv';
config();


import { z } from 'zod';

const envSchema = z.object({
    // Servidor
    PORT: z.string().default('3000').transform(Number),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Banco de dados
    DATABASE_URL: z.string().url('DATABASE_URL inválida'),
    TEST_DATABASE_URL: z.string().url('TEST_DATABASE_URL inválida').optional(),


    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    REFRESH_SECRET: z.string().min(32, 'REFRESH_SECRET deve ter ao menos 32 caracteres'),
    REFRESH_EXPIRES_IN: z.string().default('7d'),


    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Variáveis de ambiente inválidas:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;