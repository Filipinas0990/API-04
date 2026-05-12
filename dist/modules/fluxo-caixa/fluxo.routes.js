"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fluxoRoutes = fluxoRoutes;
const fluxo_controller_1 = require("./fluxo.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function fluxoRoutes(app) {
    app.addHook('preHandler', auth_middleware_1.authMiddleware);
    app.get('/', fluxo_controller_1.fluxoController.list);
    app.post('/', fluxo_controller_1.fluxoController.create);
    app.get('/saldo', fluxo_controller_1.fluxoController.getSaldo);
    app.get('/:id', fluxo_controller_1.fluxoController.getById);
    app.put('/:id', fluxo_controller_1.fluxoController.update);
    app.delete('/:id', fluxo_controller_1.fluxoController.remove);
}
//# sourceMappingURL=fluxo.routes.js.map