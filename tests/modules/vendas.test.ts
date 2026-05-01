import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/shared/server';
import { db } from '../../src/database/client';
import { users, refreshTokens } from '../../src/modules/auth/auth.schema';
import { leads } from '../../src/modules/leads/lead.db.schema';
import { imoveis } from '../../src/modules/imoveis/imovel.db.schema';
import { vendas } from '../../src/modules/vendas/venda.db.schema';

const app = buildApp();
let tokenA: string;
let tokenB: string;

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });

beforeEach(async () => {
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

describe('POST /api/v1/vendas', () => {
    it('deve criar venda e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 350000, tipo: 'Venda' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('Em negociação');
        expect(res.body.tipo).toBe('Venda');
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/vendas')
            .send({ valor: 350000 });
        expect(res.status).toBe(401);
    });

    it('deve retornar 400 sem valor', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'Venda' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/v1/vendas', () => {
    it('deve listar somente vendas do usuário', async () => {
        await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 100000 });

        await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ valor: 200000 });

        const res = await supertest(app.server)
            .get('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });

    it('deve filtrar por status', async () => {
        await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 100000, status: 'Em negociação' });

        await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 200000, status: 'Concluída' });

        const res = await supertest(app.server)
            .get('/api/v1/vendas?status=Concluída')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].status).toBe('Concluída');
    });
});

describe('GET /api/v1/vendas/resumo', () => {
    it('deve retornar resumo financeiro', async () => {
        await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 100000, status: 'Concluída' });

        await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 200000, status: 'Em negociação' });

        const res = await supertest(app.server)
            .get('/api/v1/vendas/resumo')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('total_vendas');
        expect(res.body).toHaveProperty('valor_total');
        expect(res.body).toHaveProperty('comissao_total');
        expect(res.body.total_vendas).toBe(2);
        expect(res.body.vendas_concluidas).toBe(1);
    });
});

describe('PATCH /api/v1/vendas/:id/status', () => {
    it('deve atualizar status da venda', async () => {
        const created = await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 100000 });

        const res = await supertest(app.server)
            .patch(`/api/v1/vendas/${created.body.id}/status`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ status: 'Proposta enviada' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Proposta enviada');
    });

    it('deve retornar 400 com status inválido', async () => {
        const created = await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 100000 });

        const res = await supertest(app.server)
            .patch(`/api/v1/vendas/${created.body.id}/status`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ status: 'status_invalido' });

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/v1/vendas/:id', () => {
    it('deve deletar venda e retornar 204', async () => {
        const created = await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 100000 });

        const res = await supertest(app.server)
            .delete(`/api/v1/vendas/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);
    });

    it('usuário B não deleta venda do usuário A', async () => {
        const created = await supertest(app.server).post('/api/v1/vendas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor: 100000 });

        const res = await supertest(app.server)
            .delete(`/api/v1/vendas/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});