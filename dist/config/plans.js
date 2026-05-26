"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_FEATURES = exports.PLAN_FEATURES = void 0;
exports.hasFeature = hasFeature;
exports.getLockedFeatures = getLockedFeatures;
exports.PLAN_FEATURES = {
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
exports.ALL_FEATURES = [
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
function hasFeature(plano, feature) {
    return exports.PLAN_FEATURES[plano]?.includes(feature) ?? false;
}
function getLockedFeatures(plano) {
    return exports.ALL_FEATURES.filter(f => !exports.PLAN_FEATURES[plano]?.includes(f));
}
//# sourceMappingURL=plans.js.map