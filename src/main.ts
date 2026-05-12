import { buildApp } from './shared/server';
import 'dotenv/config';

import { env } from './config/env';
import { runMigrations } from './database/migrate';
import { iniciarJobLembretes } from './modules/whatAapp/lembrete-visita.job';

process.on('uncaughtException', (err) => {
    console.error('[uncaughtException] Erro não capturado — processo continuando:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection] Promise rejeitada não tratada:', reason);
});

async function main() {
    await runMigrations();

    const app = buildApp();

    try {
        await app.listen({ port: env.PORT, host: '0.0.0.0' });
        console.log(`🚀 Servidor rodando na porta ${env.PORT}`);
        iniciarJobLembretes();
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();