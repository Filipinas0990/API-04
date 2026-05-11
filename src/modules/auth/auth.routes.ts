import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller';
import { authMiddleware, adminMiddleware } from '../../middlewares/auth.middleware';

export async function authRoutes(app: FastifyInstance) {

    app.post('/register', { preHandler: adminMiddleware }, authController.register);
    app.post('/register-imobiliaria', { preHandler: adminMiddleware }, authController.registerImobiliaria);
    app.post('/reset-password', { preHandler: adminMiddleware }, authController.resetPassword);
    app.post('/login', authController.login);
    app.post('/refresh', authController.refresh);
    app.delete('/logout', authController.logout);


    app.get('/me', { preHandler: authMiddleware }, authController.me);
    app.put('/me', { preHandler: authMiddleware }, authController.updateMe);
}