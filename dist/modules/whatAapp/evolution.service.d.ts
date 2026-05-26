export declare const evolutionService: {
    sendText(instanceName: string, telefone: string, mensagem: string): Promise<boolean>;
    sendMedia(instanceName: string, telefone: string, tipo: "imagem" | "video" | "audio", mediaUrl: string, caption?: string): Promise<boolean>;
    sendTyping(instanceName: string, telefone: string, duracaoMs?: number): Promise<void>;
    getStatus(instanceName: string): Promise<{
        connected: boolean;
        instance: string;
    }>;
};
//# sourceMappingURL=evolution.service.d.ts.map