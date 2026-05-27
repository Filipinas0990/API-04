import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/shared/server';
import { db } from '../../src/database/client';
import { users, refreshTokens } from '../../src/modules/auth/auth.schema';
import { leads } from '../../src/modules/leads/lead.db.schema';
import { visitas } from '../../src/modules/visitas/visita.db.schema';
import { metas } from '../../src/modules/metas/meta.db.schema';
import { env } from '../../src/config/env';

const app = buildApp();
let tokenA: string;
let tokenB: string;

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });

beforeEach(async () => {
    await db.delete(metas);
    await db.delete(visitas);
    await db.delete(leads);
    await db.delete(refreshTokens);
    await db.delete(users);

    await supertest(app.server).post('/api/v1/auth/register')
        .set('x-admin-key', env.ADMIN_SECRET)
        .send({ name: 'Usuario A', email: 'a@teste.com', password: 'Senha@123' });
    const loginA = await supertest(app.server).post('/api/v1/auth/login')
        .send({ email: 'a@teste.com', password: 'Senha@123' });
    tokenA = loginA.body.access_token;

    await supertest(app.server).post('/api/v1/auth/register')
        .set('x-admin-key', env.ADMIN_SECRET)
        .send({ name: 'Usuario B', email: 'b@teste.com', password: 'Senha@123' });
    const loginB = await supertest(app.server).post('/api/v1/auth/login')
        .send({ email: 'b@teste.com', password: 'Senha@123' });
    tokenB = loginB.body.access_token;
});

describe('POST /api/v1/metas', () => {
    it('deve criar meta e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'novos_clientes', valor_alvo: 10, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.tipo).toBe('novos_clientes');
        expect(res.body.valor_alvo).toBe(10);
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/metas')
            .send({ tipo: 'visitas', valor_alvo: 5, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        expect(res.status).toBe(401);
    });

    it('deve rejeitar tipo inválido', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'tipo_invalido', valor_alvo: 5, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        expect(res.status).toBe(400);
    });

    it('deve rejeitar valor_alvo negativo', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'visitas', valor_alvo: -1, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        expect(res.status).toBe(400);
    });
});

describe('GET /api/v1/metas', () => {
    it('deve listar apenas metas do usuário autenticado', async () => {
        await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'novos_clientes', valor_alvo: 10, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ tipo: 'visitas', valor_alvo: 5, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        const res = await supertest(app.server)
            .get('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].tipo).toBe('novos_clientes');
    });

    it('deve retornar progresso e percentual calculados', async () => {
        await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'novos_clientes', valor_alvo: 10, data_inicio: '2026-01-01', data_fim: '2026-12-31' });

        await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João', telefone: '64999999999' });

        await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Maria', telefone: '64888888888' });

        const res = await supertest(app.server)
            .get('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('progresso');
        expect(res.body[0]).toHaveProperty('percentual');
        expect(res.body[0].progresso).toBe(2);
        expect(res.body[0].percentual).toBe(20);
    });

    it('deve retornar progresso zerado quando não há dados no período', async () => {
        await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'novos_clientes', valor_alvo: 10, data_inicio: '2020-01-01', data_fim: '2020-01-31' });

        const res = await supertest(app.server)
            .get('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.body[0].progresso).toBe(0);
        expect(res.body[0].percentual).toBe(0);
    });
});

describe('PUT /api/v1/metas/:id', () => {
    it('deve atualizar meta e retornar 200', async () => {
        const criou = await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'novos_clientes', valor_alvo: 10, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        const res = await supertest(app.server)
            .put(`/api/v1/metas/${criou.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ valor_alvo: 20 });

        expect(res.status).toBe(200);
        expect(res.body.valor_alvo).toBe(20);
    });

    it('deve retornar 404 ao tentar atualizar meta de outro usuário', async () => {
        const criou = await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'novos_clientes', valor_alvo: 10, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        const res = await supertest(app.server)
            .put(`/api/v1/metas/${criou.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ valor_alvo: 99 });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/v1/metas/:id', () => {
    it('deve deletar meta e retornar 204', async () => {
        const criou = await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'visitas', valor_alvo: 5, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        const res = await supertest(app.server)
            .delete(`/api/v1/metas/${criou.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);

        const lista = await supertest(app.server)
            .get('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(lista.body).toHaveLength(0);
    });

    it('deve retornar 404 ao deletar meta de outro usuário', async () => {
        const criou = await supertest(app.server)
            .post('/api/v1/metas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'visitas', valor_alvo: 5, data_inicio: '2026-05-01', data_fim: '2026-05-31' });

        const res = await supertest(app.server)
            .delete(`/api/v1/metas/${criou.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});
