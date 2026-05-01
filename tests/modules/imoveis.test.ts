import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/shared/server';
import { db } from '../../src/database/client';
import { users, refreshTokens } from '../../src/modules/auth/auth.schema';
import { leads } from '../../src/modules/leads/lead.db.schema';
import { imoveis } from '../../src/modules/imoveis/imovel.db.schema';

const app = buildApp();
let tokenA: string;
let tokenB: string;

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });

beforeEach(async () => {
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

describe('POST /api/v1/imoveis', () => {
    it('deve criar imóvel e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Casa Teste', tipo: 'Casa', preco: 350000, cidade: 'Rio Verde', estado: 'GO' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.titulo).toBe('Casa Teste');
        expect(res.body.status).toBe('Ativo');
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/imoveis')
            .send({ titulo: 'Casa Teste' });
        expect(res.status).toBe(401);
    });

    it('deve retornar 400 sem título', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ tipo: 'Casa' });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/v1/imoveis', () => {
    it('deve listar somente imóveis do usuário', async () => {
        await supertest(app.server).post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Imóvel A', tipo: 'Casa' });

        await supertest(app.server).post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ titulo: 'Imóvel B', tipo: 'Apartamento' });

        const res = await supertest(app.server)
            .get('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].titulo).toBe('Imóvel A');
    });

    it('deve filtrar por tipo', async () => {
        await supertest(app.server).post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Casa 1', tipo: 'Casa' });

        await supertest(app.server).post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Apto 1', tipo: 'Apartamento' });

        const res = await supertest(app.server)
            .get('/api/v1/imoveis?tipo=Casa')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].tipo).toBe('Casa');
    });
});

describe('GET /api/v1/imoveis/:id', () => {
    it('deve retornar imóvel por ID', async () => {
        const created = await supertest(app.server).post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Casa Teste', tipo: 'Casa' });

        const res = await supertest(app.server)
            .get(`/api/v1/imoveis/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(created.body.id);
    });

    it('usuário B não acessa imóvel do usuário A', async () => {
        const created = await supertest(app.server).post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Casa Secreta', tipo: 'Casa' });

        const res = await supertest(app.server)
            .get(`/api/v1/imoveis/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});

describe('PUT /api/v1/imoveis/:id', () => {
    it('deve atualizar imóvel', async () => {
        const created = await supertest(app.server).post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Casa Velha', tipo: 'Casa' });

        const res = await supertest(app.server)
            .put(`/api/v1/imoveis/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Casa Nova', preco: 400000 });

        expect(res.status).toBe(200);
        expect(res.body.titulo).toBe('Casa Nova');
    });
});

describe('DELETE /api/v1/imoveis/:id', () => {
    it('deve deletar imóvel e retornar 204', async () => {
        const created = await supertest(app.server).post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Casa para deletar', tipo: 'Casa' });

        const res = await supertest(app.server)
            .delete(`/api/v1/imoveis/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);
    });

    it('usuário B não deleta imóvel do usuário A', async () => {
        const created = await supertest(app.server).post('/api/v1/imoveis')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ titulo: 'Casa Protegida', tipo: 'Casa' });

        const res = await supertest(app.server)
            .delete(`/api/v1/imoveis/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});