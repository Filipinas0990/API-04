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
import { fluxoCaixa } from '../../src/modules/fluxo-caixa/fluxo.db.schema';

const app = buildApp();
let tokenA: string;
let tokenB: string;

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });

beforeEach(async () => {
    await db.delete(fluxoCaixa);
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

describe('POST /api/v1/fluxo-caixa', () => {
    it('deve criar entrada e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Salário', valor: 5000, data: '2026-05-01', tipo: 'entrada' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.tipo).toBe('entrada');
        expect(res.body.status).toBe('confirmado');
    });

    it('deve criar saída e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Aluguel', valor: 1200, data: '2026-05-01', tipo: 'saida' });

        expect(res.status).toBe(201);
        expect(res.body.tipo).toBe('saida');
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/fluxo-caixa')
            .send({ descricao: 'Teste', valor: 100, data: '2026-05-01', tipo: 'entrada' });
        expect(res.status).toBe(401);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Sem valor e tipo' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/v1/fluxo-caixa', () => {
    it('deve listar somente lançamentos do usuário', async () => {
        await supertest(app.server).post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Entrada A', valor: 1000, data: '2026-05-01', tipo: 'entrada' });

        await supertest(app.server).post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ descricao: 'Entrada B', valor: 2000, data: '2026-05-01', tipo: 'entrada' });

        const res = await supertest(app.server)
            .get('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].descricao).toBe('Entrada A');
    });

    it('deve filtrar por tipo', async () => {
        await supertest(app.server).post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Salário', valor: 5000, data: '2026-05-01', tipo: 'entrada' });

        await supertest(app.server).post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Aluguel', valor: 1200, data: '2026-05-01', tipo: 'saida' });

        const res = await supertest(app.server)
            .get('/api/v1/fluxo-caixa?tipo=entrada')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].tipo).toBe('entrada');
    });
});

describe('GET /api/v1/fluxo-caixa/saldo', () => {
    it('deve retornar saldo correto', async () => {
        await supertest(app.server).post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Salário', valor: 5000, data: '2026-05-01', tipo: 'entrada' });

        await supertest(app.server).post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Aluguel', valor: 1200, data: '2026-05-01', tipo: 'saida' });

        const res = await supertest(app.server)
            .get('/api/v1/fluxo-caixa/saldo')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('saldo');
        expect(res.body).toHaveProperty('entradas');
        expect(res.body).toHaveProperty('saidas');
        expect(Number(res.body.entradas)).toBe(5000);
        expect(Number(res.body.saidas)).toBe(1200);
        expect(Number(res.body.saldo)).toBe(3800);
    });
});

describe('PUT /api/v1/fluxo-caixa/:id', () => {
    it('deve atualizar lançamento', async () => {
        const created = await supertest(app.server).post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Salário', valor: 5000, data: '2026-05-01', tipo: 'entrada' });

        const res = await supertest(app.server)
            .put(`/api/v1/fluxo-caixa/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Salário atualizado', valor: 5500 });

        expect(res.status).toBe(200);
        expect(res.body.descricao).toBe('Salário atualizado');
    });
});

describe('DELETE /api/v1/fluxo-caixa/:id', () => {
    it('deve deletar lançamento e retornar 204', async () => {
        const created = await supertest(app.server).post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Salário', valor: 5000, data: '2026-05-01', tipo: 'entrada' });

        const res = await supertest(app.server)
            .delete(`/api/v1/fluxo-caixa/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);
    });

    it('usuário B não deleta lançamento do usuário A', async () => {
        const created = await supertest(app.server).post('/api/v1/fluxo-caixa')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ descricao: 'Salário', valor: 5000, data: '2026-05-01', tipo: 'entrada' });

        const res = await supertest(app.server)
            .delete(`/api/v1/fluxo-caixa/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});