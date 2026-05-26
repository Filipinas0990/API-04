"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campanhaRoutes = campanhaRoutes;
const whatsapp_controller_1 = require("./whatsapp.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function campanhaRoutes(app) {
    app.register(async (protectedApp) => {
        protectedApp.addHook('preHandler', auth_middleware_1.authMiddleware);
        protectedApp.get('/', whatsapp_controller_1.whatsappController.listDisparos);
        protectedApp.post('/', whatsapp_controller_1.whatsappController.iniciarCampanha);
        protectedApp.get('/:id/progresso', whatsapp_controller_1.whatsappController.getProgresso);
        protectedApp.delete('/:id', whatsapp_controller_1.whatsappController.cancelarCampanha);
    });
}
//# sourceMappingURL=campanha.routes.js.map