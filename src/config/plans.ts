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
        // Única feature bloqueada no basic: 'whatsapp-ia'
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
        'automacoes',
        'campanhas',
        // Gold: novas features serão adicionadas aqui quando definidas
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
    'automacoes',
    'campanhas',
];

export function hasFeature(plano: Plano, feature: Feature): boolean {
    return PLAN_FEATURES[plano]?.includes(feature) ?? false;
}

export function getLockedFeatures(plano: Plano): Feature[] {
    return ALL_FEATURES.filter(f => !PLAN_FEATURES[plano]?.includes(f));
}
