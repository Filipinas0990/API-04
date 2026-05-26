import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/shared/server';
import { db } from '../../src/database/client';
import { users, refreshTokens } from '../../src/modules/auth/auth.schema';
import { leads } from '../../src/modules/leads/lead.db.schema';
import { etiquetas, leadEtiquetas } from '../../src/modules/etiquetas/etiqueta.db.schema';
import { env } from '../../src/config/env';

const app = buildApp();
let tokenA: string;
let tokenB: string;

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });

beforeEach(async () => {
    await db.delete(leadEtiquetas);
    await db.delete(etiquetas);
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

describe('POST /api/v1/etiquetas', () => {
    it('deve criar etiqueta e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('VIP');
        expect(res.body.color).toBe('#f59e0b');
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/etiquetas', () => {
    it('deve listar apenas etiquetas do usuário autenticado', async () => {
        await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ name: 'Facebook', color: '#6366f1', icon: 'megaphone' });

        const res = await supertest(app.server)
            .get('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('VIP');
    });
});

describe('PUT /api/v1/etiquetas/:id', () => {
    it('deve atualizar etiqueta e retornar 200', async () => {
        const criou = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        const res = await supertest(app.server)
            .put(`/api/v1/etiquetas/${criou.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Top' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Top');
    });

    it('deve retornar 404 ao tentar atualizar etiqueta de outro usuário', async () => {
        const criou = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        const res = await supertest(app.server)
            .put(`/api/v1/etiquetas/${criou.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ name: 'Hack' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/v1/etiquetas/:id', () => {
    it('deve deletar etiqueta e retornar 204', async () => {
        const criou = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        const res = await supertest(app.server)
            .delete(`/api/v1/etiquetas/${criou.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);
    });
});

describe('POST /api/v1/leads/:id/etiquetas/:etiquetaId', () => {
    it('deve aplicar etiqueta ao lead e retornar 201', async () => {
        const criaLead = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João', telefone: '64999999999' });

        const criaTag = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        const res = await supertest(app.server)
            .post(`/api/v1/leads/${criaLead.body.id}/etiquetas/${criaTag.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(201);
    });

    it('deve retornar 201 ao aplicar a mesma etiqueta duas vezes (idempotente)', async () => {
        const criaLead = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João', telefone: '64999999999' });

        const criaTag = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        await supertest(app.server)
            .post(`/api/v1/leads/${criaLead.body.id}/etiquetas/${criaTag.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        const res = await supertest(app.server)
            .post(`/api/v1/leads/${criaLead.body.id}/etiquetas/${criaTag.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(201);
    });

    it('pipeline deve retornar lead com etiqueta aplicada', async () => {
        const criaLead = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João', telefone: '64999999999' });

        const criaTag = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        await supertest(app.server)
            .post(`/api/v1/leads/${criaLead.body.id}/etiquetas/${criaTag.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        const pipeline = await supertest(app.server)
            .get('/api/v1/leads/pipeline')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(pipeline.status).toBe(200);
        const lead = pipeline.body.novo_cliente[0];
        expect(lead.etiquetas).toHaveLength(1);
        expect(lead.etiquetas[0].name).toBe('VIP');
    });

    it('deve retornar 404 ao aplicar etiqueta de outro usuário ao lead', async () => {
        const criaLead = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João', telefone: '64999999999' });

        const criaTag = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ name: 'Hack', color: '#f59e0b', icon: 'tag' });

        const res = await supertest(app.server)
            .post(`/api/v1/leads/${criaLead.body.id}/etiquetas/${criaTag.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/v1/leads/:id/etiquetas/:etiquetaId', () => {
    it('deve remover etiqueta do lead e retornar 204', async () => {
        const criaLead = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João', telefone: '64999999999' });

        const criaTag = await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        await supertest(app.server)
            .post(`/api/v1/leads/${criaLead.body.id}/etiquetas/${criaTag.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        const res = await supertest(app.server)
            .delete(`/api/v1/leads/${criaLead.body.id}/etiquetas/${criaTag.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);

        const pipeline = await supertest(app.server)
            .get('/api/v1/leads/pipeline')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(pipeline.body.novo_cliente[0].etiquetas).toHaveLength(0);
    });
});

describe('GET /api/v1/etiquetas/stats', () => {
    it('deve retornar série temporal de 7 dias por etiqueta', async () => {
        await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        const res = await supertest(app.server)
            .get('/api/v1/etiquetas/stats')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toHaveProperty('etiqueta_id');
        expect(res.body[0]).toHaveProperty('total_leads');
        expect(res.body[0].series).toHaveLength(7);
        expect(res.body[0].series[0]).toHaveProperty('date');
        expect(res.body[0].series[0]).toHaveProperty('count');
    });

    it('deve retornar somente etiquetas do usuário autenticado', async () => {
        await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'VIP', color: '#f59e0b', icon: 'tag' });

        await supertest(app.server)
            .post('/api/v1/etiquetas')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ name: 'Facebook', color: '#6366f1', icon: 'megaphone' });

        const res = await supertest(app.server)
            .get('/api/v1/etiquetas/stats')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('VIP');
    });
});
