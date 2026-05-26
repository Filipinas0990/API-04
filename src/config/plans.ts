export type Plano = 'basic' | 'premium' | 'gold';

export type Feature =
    | 'leads'
    | 'imoveis'
    | 'tarefas'
    | 'visitas'
    | 'fluxo-caixa'
    | 'vendas'
    | 'relatorios'
    | 'whatsapp'
    | 'whatsapp-ia'
    | 'assistente-filipe'
    | 'automacoes'
    | 'campanhas';

export const PLAN_FEATURES: Record<Plano, Feature[]> = {
    basic: [
        'leads',
        'imoveis',
        'tarefas',
        'visitas',
        'fluxo-caixa',
        'vendas',
        'relatorios',
        'whatsapp',
        'automacoes',
        'campanhas',
        // Bloqueadas no basic: 'whatsapp-ia', 'assistente-filipe'
    ],
    premium: [
        'leads',
        'imoveis',
        'tarefas',
        'visitas',
        'fluxo-caixa',
        'vendas',
        'relatorios',
        'whatsapp',
        'whatsapp-ia',
        'assistente-filipe',
        'automacoes',
        'campanhas',
    ],
    gold: [
        'leads',
        'imoveis',
        'tarefas',
        'visitas',
        'fluxo-caixa',
        'vendas',
        'relatorios',
        'whatsapp',
        'whatsapp-ia',
        'assistente-filipe',
        'automacoes',
        'campanhas',
    ],
};

export const ALL_FEATURES: Feature[] = [
    'leads',
    'imoveis',
    'tarefas',
    'visitas',
    'fluxo-caixa',
    'vendas',
    'relatorios',
    'whatsapp',
    'whatsapp-ia',
    'assistente-filipe',
    'automacoes',
    'campanhas',
];

export function hasFeature(plano: Plano, feature: Feature): boolean {
    return PLAN_FEATURES[plano]?.includes(feature) ?? false;
}

export function getLockedFeatures(plano: Plano): Feature[] {
    return ALL_FEATURES.filter(f => !PLAN_FEATURES[plano]?.includes(f));
}
