"use strict";
/**
 * Fila de mensagens do assistente Filipe (BullMQ + Redis).
 * Completamente isolada — não afeta nenhuma outra funcionalidade do sistema.
 * Se REDIS_URL não estiver configurada, exporta `enfileirar` como no-op e o
 * caller faz o processamento direto (comportamento anterior).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iniciarFilipeWorker = iniciarFilipeWorker;
exports.enfileirarFilipe = enfileirarFilipe;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
let filipeQueue = null;
function iniciarFilipeWorker(handler) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.log('[Filipe] REDIS_URL não definida — fila desativada, processamento direto.');
        return;
    }
    const connection = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null });
    filipeQueue = new bullmq_1.Queue('filipe-assistente', { connection });
    new bullmq_1.Worker('filipe-assistente', async (job) => {
        await handler(job.data.instancia, job.data.telefone, job.data.conteudo);
    }, {
        connection,
        concurrency: 5, // máximo de 5 chamadas simultâneas à OpenAI
    });
    console.log('[Filipe] Worker BullMQ iniciado (concurrency=5).');
}
async function enfileirarFilipe(job) {
    if (!filipeQueue)
        return false; // Redis não disponível — caller processa direto
    await filipeQueue.add('mensagem', job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    });
    return true;
}
//# sourceMappingURL=filipe.queue.js.map