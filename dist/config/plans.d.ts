export type Plano = 'basic' | 'premium' | 'gold';
export type Feature = 'leads' | 'imoveis' | 'tarefas' | 'visitas' | 'fluxo-caixa' | 'vendas' | 'relatorios' | 'whatsapp' | 'whatsapp-ia' | 'automacoes' | 'campanhas';
export declare const PLAN_FEATURES: Record<Plano, Feature[]>;
export declare const ALL_FEATURES: Feature[];
export declare function hasFeature(plano: Plano, feature: Feature): boolean;
export declare function getLockedFeatures(plano: Plano): Feature[];
//# sourceMappingURL=plans.d.ts.map