import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/shared/server';
import { db } from '../../src/database/client';
import { users, refreshTokens } from '../../src/modules/auth/auth.schema';
import { leads } from '../../src/modules/leads/lead.db.schema';
import { imoveis } from '../../src/modules/imoveis/imovel.db.schema';
import { vendas } from '../../src/modules/vendas/venda.db.schema';
import { tarefas } from '../../src/modules/tarefas/tarefa.db.schema';

const app = buildApp();
let tokenA: string;
let tokenB: string;

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });

beforeEach(async () => {
    await db.delete(tarefas);
    await db.delete(vendas);
    await db.delete(imoveis);
    await db.delete(leads);
    await db.delete(refreshTokens);
    await db.delete(users);

    await supertest(app.server).post('/api/v1/auth/register')
        .send({ name: 'Usuario A', email: 'a@teste.com', password: 'Senha@123' });
    const loginA = await supertest(app.server).post('/api/v1/auth/login')
        .send({ email: 'a@teste.com', password: 'Senha@123' });
    tokenA = loginA.body.access_token;

    await supertest(app.server).post('/api/v1/auth/register')
        .send({ name: 'Usuario B', email: 'b@teste.com', password: 'Senha@123' });
    const loginB = await supertest(app.server).post('/api/v1/auth/login')
        .send({ email: 'b@teste.com', password: 'Senha@123' });
    tokenB = loginB.body.access_token;
});

describe('POST /api/v1/tarefas', () => {
    it('deve criar tarefa e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Ligar para cliente', prioridade: 'alta' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.titulo).toBe('Ligar para cliente');
        expect(res.body.status).toBe('PENDENTE');
        expect(res.body.concluido).toBe(false);
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/tarefas')
            .send({ titulo: 'Tarefa teste' });
        expect(res.status).toBe(401);
    });

    it('deve retornar 400 sem título', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ prioridade: 'alta' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/v1/tarefas', () => {
    it('deve listar somente tarefas do usuário', async () => {
        await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa do A' });

        await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ titulo: 'Tarefa do B' });

        const res = await supertest(app.server)
            .get('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].titulo).toBe('Tarefa do A');
    });

    it('deve filtrar por status', async () => {
        await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa pendente', status: 'PENDENTE' });

        await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa concluída', status: 'CONCLUÍDA' });

        const res = await supertest(app.server)
            .get('/api/v1/tarefas?status=PENDENTE')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].status).toBe('PENDENTE');
    });

    it('deve filtrar por prioridade', async () => {
        await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa normal', prioridade: 'normal' });

        await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa urgente', prioridade: 'urgente' });

        const res = await supertest(app.server)
            .get('/api/v1/tarefas?prioridade=urgente')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].prioridade).toBe('urgente');
    });
});

describe('PATCH /api/v1/tarefas/:id/concluir', () => {
    it('deve marcar tarefa como concluída', async () => {
        const created = await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa para concluir' });

        const res = await supertest(app.server)
            .patch(`/api/v1/tarefas/${created.body.id}/concluir`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('CONCLUÍDA');
        expect(res.body.concluido).toBe(true);
        expect(res.body.concluida_em).not.toBeNull();
    });
});

describe('PATCH /api/v1/tarefas/:id/status', () => {
    it('deve atualizar status da tarefa', async () => {
        const created = await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa teste' });

        const res = await supertest(app.server)
            .patch(`/api/v1/tarefas/${created.body.id}/status`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ status: 'EM_ANDAMENTO' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('EM_ANDAMENTO');
    });

    it('deve retornar 400 com status inválido', async () => {
        const created = await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa teste' });

        const res = await supertest(app.server)
            .patch(`/api/v1/tarefas/${created.body.id}/status`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ status: 'INVALIDO' });

        expect(res.status).toBe(400);
    });
});

describe('PUT /api/v1/tarefas/:id', () => {
    it('deve atualizar tarefa', async () => {
        const created = await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa original' });

        const res = await supertest(app.server)
            .put(`/api/v1/tarefas/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa atualizada', prioridade: 'urgente' });

        expect(res.status).toBe(200);
        expect(res.body.titulo).toBe('Tarefa atualizada');
        expect(res.body.prioridade).toBe('urgente');
    });
});

describe('DELETE /api/v1/tarefas/:id', () => {
    it('deve deletar tarefa e retornar 204', async () => {
        const created = await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa para deletar' });

        const res = await supertest(app.server)
            .delete(`/api/v1/tarefas/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);
    });

    it('usuário B não deleta tarefa do usuário A', async () => {
        const created = await supertest(app.server).post('/api/v1/tarefas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Tarefa protegida' });

        const res = await supertest(app.server)
            .delete(`/api/v1/tarefas/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});