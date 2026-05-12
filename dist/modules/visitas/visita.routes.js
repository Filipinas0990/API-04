"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitaRoutes = visitaRoutes;
const visita_controller_1 = require("./visita.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function visitaRoutes(app) {
    app.addHook('preHandler', auth_middleware_1.authMiddleware);
    app.get('/', visita_controller_1.visitaController.list);
    app.post('/', visita_controller_1.visitaController.create);
    app.get('/:id', visita_controller_1.visitaController.getById);
    app.put('/:id', visita_controller_1.visitaController.update);
    app.delete('/:id', visita_controller_1.visitaController.remove);
    app.patch('/:id/status', visita_controller_1.visitaController.updateStatus);
}
//# sourceMappingURL=visita.routes.js.map