/**
 * Fila de mensagens do assistente Filipe (BullMQ + Redis).
 * Completamente isolada — não afeta nenhuma outra funcionalidade do sistema.
 * Se REDIS_URL não estiver configurada, exporta `enfileirar` como no-op e o
 * caller faz o processamento direto (comportamento anterior).
 */

import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

export interface FilipeJob {
    instancia: string;
    telefone: string;
    conteudo: string;
}

let filipeQueue: Queue<FilipeJob> | null = null;

export function iniciarFilipeWorker(
    handler: (instancia: string, telefone: string, conteudo: string) => Promise<void>,
): void {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.log('[Filipe] REDIS_URL não definida — fila desativada, processamento direto.');
        return;
    }

    const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    filipeQueue = new Queue<FilipeJob>('filipe-assistente', { connection });

    new Worker<FilipeJob>(
        'filipe-assistente',
        async (job: Job<FilipeJob>) => {
            await handler(job.data.instancia, job.data.telefone, job.data.conteudo);
        },
        {
            connection,
            concurrency: 5, // máximo de 5 chamadas simultâneas à OpenAI
        },
    );

    console.log('[Filipe] Worker BullMQ iniciado (concurrency=5).');
}

export async function enfileirarFilipe(job: FilipeJob): Promise<boolean> {
    if (!filipeQueue) return false; // Redis não disponível — caller processa direto
    await filipeQueue.add('mensagem', job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    });
    return true;
}
