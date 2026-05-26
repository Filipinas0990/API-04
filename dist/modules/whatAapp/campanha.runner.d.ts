export interface EtapaDaCampanha {
    tipo: 'texto' | 'imagem' | 'video' | 'audio';
    conteudo: string;
    intervalo_antes: number;
}
export interface LeadDaCampanha {
    id: string;
    name: string;
    telefone: string;
    interesse?: string | null;
}
export interface OpcoesCampanha {
    disparoId: string;
    userId: string;
    leads: LeadDaCampanha[];
    mensagem: string;
    etapas?: EtapaDaCampanha[];
    intervaloMs: number;
}
export declare const campanhaRunner: {
    iniciar(opts: OpcoesCampanha): void;
    cancelar(disparoId: string): boolean;
    estaRodando(disparoId: string): boolean;
};
//# sourceMappingURL=campanha.runner.d.ts.map