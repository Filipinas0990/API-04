"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendaRoutes = vendaRoutes;
const venda_controller_1 = require("./venda.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function vendaRoutes(app) {
    app.addHook('preHandler', auth_middleware_1.authMiddleware);
    app.get('/', venda_controller_1.vendaController.list);
    app.post('/', venda_controller_1.vendaController.create);
    app.get('/resumo', venda_controller_1.vendaController.getResumo);
    app.get('/:id', venda_controller_1.vendaController.getById);
    app.put('/:id', venda_controller_1.vendaController.update);
    app.delete('/:id', venda_controller_1.vendaController.remove);
    app.patch('/:id/status', venda_controller_1.vendaController.updateStatus);
}
//# sourceMappingURL=venda.routes.js.map