interface MensagemIA {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
interface IntencaoIA {
    acao: 'registrar_lead' | 'registrar_venda' | 'registrar_imovel' | 'consultar' | 'desconhecido';
    dados: Record<string, unknown>;
    resposta: string;
}
export declare const assistenteService: {
    processar(mensagem: string, historico?: MensagemIA[]): Promise<IntencaoIA>;
};
export {};
//# sourceMappingURL=assistente.service.d.ts.map