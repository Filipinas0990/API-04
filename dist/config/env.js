"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    // Servidor
    PORT: zod_1.z.string().default('3000').transform(Number),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    // Banco de dados
    DATABASE_URL: zod_1.z.string().url('DATABASE_URL inválida'),
    TEST_DATABASE_URL: zod_1.z.string().url('TEST_DATABASE_URL inválida').optional(),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    REFRESH_SECRET: zod_1.z.string().min(32, 'REFRESH_SECRET deve ter ao menos 32 caracteres'),
    REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:5173'),
    EVOLUTION_API_URL: zod_1.z.string().url(),
    EVOLUTION_API_KEY: zod_1.z.string().min(1),
    EVOLUTION_INSTANCE: zod_1.z.string().optional(),
    OPENAI_API_KEY: zod_1.z.string().min(1),
    FILIPE_INSTANCE: zod_1.z.string().optional(),
    FILIPE_PHONE: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
    ADMIN_SECRET: zod_1.z.string().min(16, 'ADMIN_SECRET deve ter ao menos 16 caracteres'),
    WEBHOOK_SECRET: zod_1.z.string().min(8).optional(),
    API_URL: zod_1.z.string().url().default('http://localhost:3000'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Variáveis de ambiente inválidas:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map