"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("../modules/org/org.db.schema"), exports);
__exportStar(require("../modules/auth/auth.schema"), exports);
__exportStar(require("../modules/leads/lead.db.schema"), exports);
__exportStar(require("../modules/imoveis/imovel.db.schema"), exports);
__exportStar(require("../modules/vendas/venda.db.schema"), exports);
__exportStar(require("../modules/tarefas/tarefa.db.schema"), exports);
__exportStar(require("../modules/visitas/visita.db.schema"), exports);
__exportStar(require("../modules/fluxo-caixa/fluxo.db.schema"), exports);
__exportStar(require("../modules/whatAapp/whatsapp.db.schema"), exports);
//# sourceMappingURL=shema.js.map