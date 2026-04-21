// src/modules/leads/lead.routes.ts
// Aqui só declaramos as rotas e apontamos para o controller.
// Quando você adicionar Auth, o middleware entra aqui.

import type { FastifyInstance } from 'fastify'
import { leadController } from './lead.controller.js'

export async function leadRoutes(fastify: FastifyInstance) {
    // Prefixo /leads já vem configurado no server.ts

    fastify.get('/', leadController.list)
    fastify.get('/:id', leadController.getById)
    fastify.post('/', leadController.create)
    fastify.patch('/:id', leadController.update)
    fastify.delete('/:id', leadController.remove)
}