import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/shared/server';
import { db } from '../../src/database/client';
import { users, refreshTokens } from '../../src/modules/auth/auth.schema';

const app = buildApp();

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });


beforeEach(async () => {
    await db.delete(refreshTokens);
    await db.delete(users);
});

describe('POST /api/v1/auth/register', () => {
    it('deve criar usuário e retornar 201', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/auth/register')
            .send({ name: 'Filipe', email: 'filipe@teste.com', password: 'Senha@123' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('filipe@teste.com');
        expect(res.body).not.toHaveProperty('password');
    });

    it('deve retornar 409 se email já cadastrado', async () => {
        await supertest(app.server)
            .post('/api/v1/auth/register')
            .send({ name: 'Filipe', email: 'filipe@teste.com', password: 'Senha@123' });

        const res = await supertest(app.server)
            .post('/api/v1/auth/register')
            .send({ name: 'Filipe', email: 'filipe@teste.com', password: 'Senha@123' });

        expect(res.status).toBe(409);
    });

    it('deve retornar 400 se dados inválidos', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/auth/register')
            .send({ name: 'F', email: 'nao-e-email', password: '123' });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
        await supertest(app.server)
            .post('/api/v1/auth/register')
            .send({ name: 'Filipe', email: 'filipe@teste.com', password: 'Senha@123' });
    });

    it('deve retornar access_token com credenciais corretas', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/auth/login')
            .send({ email: 'filipe@teste.com', password: 'Senha@123' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('access_token');
        expect(res.body.user.email).toBe('filipe@teste.com');
    });

    it('deve retornar 401 com senha errada', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/auth/login')
            .send({ email: 'filipe@teste.com', password: 'senhaerrada' });

        expect(res.status).toBe(401);
    });

    it('deve retornar 401 com email inexistente', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/auth/login')
            .send({ email: 'naoexiste@teste.com', password: 'Senha@123' });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
        await supertest(app.server)
            .post('/api/v1/auth/register')
            .send({ name: 'Filipe', email: 'filipe@teste.com', password: 'Senha@123' });

        const res = await supertest(app.server)
            .post('/api/v1/auth/login')
            .send({ email: 'filipe@teste.com', password: 'Senha@123' });

        accessToken = res.body.access_token;
    });

    it('deve retornar dados do usuário autenticado', async () => {
        const res = await supertest(app.server)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe('filipe@teste.com');
        expect(res.body).not.toHaveProperty('password');
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server).get('/api/v1/auth/me');
        expect(res.status).toBe(401);
    });

    it('deve retornar 401 com token inválido', async () => {
        const res = await supertest(app.server)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer token_invalido');
        expect(res.status).toBe(401);
    });
});

describe('Isolamento por user_id', () => {
    it('usuário A não acessa dados do usuário B', async () => {

        await supertest(app.server)
            .post('/api/v1/auth/register')
            .send({ name: 'Usuario A', email: 'a@teste.com', password: 'Senha@123' });


        await supertest(app.server)
            .post('/api/v1/auth/register')
            .send({ name: 'Usuario B', email: 'b@teste.com', password: 'Senha@123' });


        const loginA = await supertest(app.server)
            .post('/api/v1/auth/login')
            .send({ email: 'a@teste.com', password: 'Senha@123' });

        const tokenA = loginA.body.access_token;


        const resA = await supertest(app.server)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(resA.body.email).toBe('a@teste.com');
        expect(resA.body.email).not.toBe('b@teste.com');
    });
});