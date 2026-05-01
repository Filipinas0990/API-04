import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/shared/server';
import { db } from '../../src/database/client';
import { users, refreshTokens } from '../../src/modules/auth/auth.schema';
import { leads } from '../../src/modules/leads/lead.db.schema';

const app = buildApp();
let tokenA: string;
let tokenB: string;

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });

beforeEach(async () => {
    await db.delete(leads);
    await db.delete(refreshTokens);
    await db.delete(users);

    // Cria usuário A e faz login
    await supertest(app.server).post('/api/v1/auth/register')
        .send({ name: 'Usuario A', email: 'a@teste.com', password: 'Senha@123' });
    const loginA = await supertest(app.server).post('/api/v1/auth/login')
        .send({ email: 'a@teste.com', password: 'Senha@123' });
    tokenA = loginA.body.access_token;

    // Cria usuário B e faz login
    await supertest(app.server).post('/api/v1/auth/register')
        .send({ name: 'Usuario B', email: 'b@teste.com', password: 'Senha@123' });
    const loginB = await supertest(app.server).post('/api/v1/auth/login')
        .send({ email: 'b@teste.com', password: 'Senha@123' });
    tokenB = loginB.body.access_token;
});

describe('POST /api/v1/leads', () => {
    it('deve criar lead e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João Silva', telefone: '64999999999' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('João Silva');
        expect(res.body.status).toBe('novo_cliente');
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/leads')
            .send({ name: 'João', telefone: '64999999999' });
        expect(res.status).toBe(401);
    });

    it('deve retornar 400 com dados inválidos', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'J' }); // nome curto + sem telefone
        expect(res.status).toBe(400);
    });
});

describe('GET /api/v1/leads', () => {
    it('deve listar somente os leads do usuário', async () => {
        // Cria lead para A
        await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Lead do A', telefone: '64999999999' });

        // Cria lead para B
        await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ name: 'Lead do B', telefone: '64888888888' });

        const res = await supertest(app.server)
            .get('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('Lead do A');
    });
});

describe('GET /api/v1/leads/:id', () => {
    it('deve retornar lead por ID', async () => {
        const created = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João Silva', telefone: '64999999999' });

        const res = await supertest(app.server)
            .get(`/api/v1/leads/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(created.body.id);
    });

    it('usuário B não acessa lead do usuário A', async () => {
        const created = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Lead Secreto', telefone: '64999999999' });

        const res = await supertest(app.server)
            .get(`/api/v1/leads/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});

describe('PUT /api/v1/leads/:id', () => {
    it('deve atualizar lead', async () => {
        const created = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João Silva', telefone: '64999999999' });

        const res = await supertest(app.server)
            .put(`/api/v1/leads/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João Atualizado' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('João Atualizado');
    });
});

describe('PATCH /api/v1/leads/:id/status', () => {
    it('deve mover lead no pipeline', async () => {
        const created = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João Silva', telefone: '64999999999' });

        const res = await supertest(app.server)
            .patch(`/api/v1/leads/${created.body.id}/status`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ status: 'em_contato' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('em_contato');
    });

    it('deve retornar 400 com status inválido', async () => {
        const created = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João Silva', telefone: '64999999999' });

        const res = await supertest(app.server)
            .patch(`/api/v1/leads/${created.body.id}/status`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ status: 'status_invalido' });

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/v1/leads/:id', () => {
    it('deve deletar lead e retornar 204', async () => {
        const created = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'João Silva', telefone: '64999999999' });

        const res = await supertest(app.server)
            .delete(`/api/v1/leads/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);
    });

    it('usuário B não deleta lead do usuário A', async () => {
        const created = await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Lead Protegido', telefone: '64999999999' });

        const res = await supertest(app.server)
            .delete(`/api/v1/leads/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});

describe('GET /api/v1/leads/pipeline', () => {
    it('deve retornar leads agrupados por status', async () => {
        await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Lead 1', telefone: '64999999991', status: 'novo_cliente' });

        await supertest(app.server)
            .post('/api/v1/leads')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Lead 2', telefone: '64999999992', status: 'em_contato' });

        const res = await supertest(app.server)
            .get('/api/v1/leads/pipeline')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('novo_cliente');
        expect(res.body).toHaveProperty('em_contato');
        expect(res.body.novo_cliente).toHaveLength(1);
        expect(res.body.em_contato).toHaveLength(1);
    });
});