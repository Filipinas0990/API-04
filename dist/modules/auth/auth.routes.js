"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
async function authRoutes(app) {
    app.post('/register', { preHandler: auth_middleware_1.adminMiddleware }, auth_controller_1.authController.register);
    app.post('/register-imobiliaria', { preHandler: auth_middleware_1.adminMiddleware }, auth_controller_1.authController.registerImobiliaria);
    app.post('/register-admin', { preHandler: auth_middleware_1.adminMiddleware }, auth_controller_1.authController.registerAdmin);
    app.post('/reset-password', { preHandler: auth_middleware_1.adminMiddleware }, auth_controller_1.authController.resetPassword);
    app.post('/login', auth_controller_1.authController.login);
    app.post('/refresh', auth_controller_1.authController.refresh);
    app.delete('/logout', auth_controller_1.authController.logout);
    app.get('/me', { preHandler: auth_middleware_1.authMiddleware }, auth_controller_1.authController.me);
    app.put('/me', { preHandler: auth_middleware_1.authMiddleware }, auth_controller_1.authController.updateMe);
    app.get('/assistente/config', { preHandler: auth_middleware_1.authMiddleware }, auth_controller_1.authController.getAssistenteConfig);
}
//# sourceMappingURL=auth.routes.js.map