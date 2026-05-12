"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imovelRoutes = imovelRoutes;
const imovel_controller_1 = require("./imovel.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function imovelRoutes(app) {
    app.addHook('preHandler', auth_middleware_1.authMiddleware);
    app.get('/', imovel_controller_1.imovelController.list);
    app.post('/', imovel_controller_1.imovelController.create);
    app.get('/:id', imovel_controller_1.imovelController.getById);
    app.put('/:id', imovel_controller_1.imovelController.update);
    app.delete('/:id', imovel_controller_1.imovelController.remove);
}
//# sourceMappingURL=imovel.routes.js.map