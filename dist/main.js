"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./shared/server");
require("dotenv/config");
const env_1 = require("./config/env");
const migrate_1 = require("./database/migrate");
const lembrete_visita_job_1 = require("./modules/whatAapp/lembrete-visita.job");
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException] Erro não capturado — processo continuando:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection] Promise rejeitada não tratada:', reason);
});
async function main() {
    await (0, migrate_1.runMigrations)();
    const app = (0, server_1.buildApp)();
    try {
        await app.listen({ port: env_1.env.PORT, host: '0.0.0.0' });
        console.log(`🚀 Servidor rodando na porta ${env_1.env.PORT}`);
        (0, lembrete_visita_job_1.iniciarJobLembretes)();
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=main.js.map