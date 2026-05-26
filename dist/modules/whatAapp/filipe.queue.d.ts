/**
 * Fila de mensagens do assistente Filipe (BullMQ + Redis).
 * Completamente isolada — não afeta nenhuma outra funcionalidade do sistema.
 * Se REDIS_URL não estiver configurada, exporta `enfileirar` como no-op e o
 * caller faz o processamento direto (comportamento anterior).
 */
export interface FilipeJob {
    instancia: string;
    telefone: string;
    conteudo: string;
}
export declare function iniciarFilipeWorker(handler: (instancia: string, telefone: string, conteudo: string) => Promise<void>): void;
export declare function enfileirarFilipe(job: FilipeJob): Promise<boolean>;
//# sourceMappingURL=filipe.queue.d.ts.map