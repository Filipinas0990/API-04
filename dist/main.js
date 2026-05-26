"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./shared/server");
require("dotenv/config");
const env_1 = require("./config/env");
const migrate_1 = require("./database/migrate");
const lembrete_visita_job_1 = require("./modules/whatAapp/lembrete-visita.job");
const filipe_queue_1 = require("./modules/whatAapp/filipe.queue");
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
        // Inicia worker do Filipe (só ativa se REDIS_URL estiver configurada)
        const { handleFilipeAssistenteExterno } = await Promise.resolve().then(() => __importStar(require('./modules/whatAapp/whatsapp.controller')));
        (0, filipe_queue_1.iniciarFilipeWorker)(handleFilipeAssistenteExterno);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=main.js.map