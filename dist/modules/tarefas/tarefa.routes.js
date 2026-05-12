"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tarefaRoutes = tarefaRoutes;
const tarefa_controller_1 = require("./tarefa.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function tarefaRoutes(app) {
    app.addHook('preHandler', auth_middleware_1.authMiddleware);
    app.get('/', tarefa_controller_1.tarefaController.list);
    app.post('/', tarefa_controller_1.tarefaController.create);
    app.get('/:id', tarefa_controller_1.tarefaController.getById);
    app.put('/:id', tarefa_controller_1.tarefaController.update);
    app.delete('/:id', tarefa_controller_1.tarefaController.remove);
    app.patch('/:id/concluir', tarefa_controller_1.tarefaController.concluir);
    app.patch('/:id/status', tarefa_controller_1.tarefaController.updateStatus);
}
//# sourceMappingURL=tarefa.routes.js.map