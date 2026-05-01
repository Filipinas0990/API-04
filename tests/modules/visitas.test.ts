import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/shared/server';
import { db } from '../../src/database/client';
import { users, refreshTokens } from '../../src/modules/auth/auth.schema';
import { leads } from '../../src/modules/leads/lead.db.schema';
import { imoveis } from '../../src/modules/imoveis/imovel.db.schema';
import { vendas } from '../../src/modules/vendas/venda.db.schema';
import { tarefas } from '../../src/modules/tarefas/tarefa.db.schema';
import { visitas } from '../../src/modules/visitas/visita.db.schema';

const app = buildApp();
let tokenA: string;
let tokenB: string;

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });

beforeEach(async () => {
    await db.delete(visitas);
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

describe('POST /api/v1/visitas', () => {
    it('deve criar visita e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ data: '2026-06-01T10:00:00', anotacoes: 'Primeira visita' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('agendada');
        expect(res.body.anotacoes).toBe('Primeira visita');
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/visitas')
            .send({ data: '2026-06-01T10:00:00' });
        expect(res.status).toBe(401);
    });

    it('deve retornar 400 sem data', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ anotacoes: 'Sem data' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/v1/visitas', () => {
    it('deve listar somente visitas do usuário', async () => {
        await supertest(app.server).post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ data: '2026-06-01T10:00:00' });

        await supertest(app.server).post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ data: '2026-06-02T10:00:00' });

        const res = await supertest(app.server)
            .get('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });

    it('deve filtrar por status', async () => {
        await supertest(app.server).post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ data: '2026-06-01T10:00:00', status: 'agendada' });

        await supertest(app.server).post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ data: '2026-06-02T10:00:00', status: 'realizada' });

        const res = await supertest(app.server)
            .get('/api/v1/visitas?status=realizada')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].status).toBe('realizada');
    });
});

describe('PATCH /api/v1/visitas/:id/status', () => {
    it('deve atualizar status da visita', async () => {
        const created = await supertest(app.server).post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ data: '2026-06-01T10:00:00' });

        const res = await supertest(app.server)
            .patch(`/api/v1/visitas/${created.body.id}/status`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ status: 'confirmada' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('confirmada');
    });

    it('deve retornar 400 com status inválido', async () => {
        const created = await supertest(app.server).post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ data: '2026-06-01T10:00:00' });

        const res = await supertest(app.server)
            .patch(`/api/v1/visitas/${created.body.id}/status`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ status: 'invalido' });

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/v1/visitas/:id', () => {
    it('deve deletar visita e retornar 204', async () => {
        const created = await supertest(app.server).post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ data: '2026-06-01T10:00:00' });

        const res = await supertest(app.server)
            .delete(`/api/v1/visitas/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);
    });

    it('usuário B não deleta visita do usuário A', async () => {
        const created = await supertest(app.server).post('/api/v1/visitas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ data: '2026-06-01T10:00:00' });

        const res = await supertest(app.server)
            .delete(`/api/v1/visitas/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});