import { buildApp } from './shared/server';
import 'dotenv/config';

import { env } from './config/env';
import { iniciarJobLembretes } from './modules/whatAapp/lembrete-visita.job';

async function main() {
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