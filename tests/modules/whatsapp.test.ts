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
import {
    conversas, mensagens, disparos, disparoLogs,
    disparosDiarios, automationFlows, automationNodes, automationSessions
} from '../../src/modules/whatAapp/whatsapp.db.schema';


const app = buildApp();
let tokenA: string;
let tokenB: string;

beforeAll(async () => { await app.ready(); });
afterAll(async () => { await app.close(); });

beforeEach(async () => {
    await db.delete(automationSessions);
    await db.delete(automationNodes);
    await db.delete(automationFlows);
    await db.delete(mensagens);
    await db.delete(disparoLogs);
    await db.delete(disparosDiarios);
    await db.delete(disparos);
    await db.delete(conversas);
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



describe('GET /api/v1/whatsapp/disparos/limite', () => {
    it('deve retornar limite diário', async () => {
        const res = await supertest(app.server)
            .get('/api/v1/whatsapp/disparos/limite')
            .set('Authorization', `Bearer ${tokenA}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('limite');
        expect(res.body).toHaveProperty('usado');
        expect(res.body).toHaveProperty('restante');
        expect(res.body.limite).toBe(20);
        expect(res.body.restante).toBe(20);
    });
});

describe('POST /api/v1/whatsapp/disparos', () => {
    it('deve retornar 400 se leads_ids vazio', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/whatsapp/disparos')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ leads_ids: [], mensagem: 'Olá!' });
        expect(res.status).toBe(400);
    });

    it('deve retornar 400 se mais de 20 leads', async () => {
        const ids = Array(21).fill('00000000-0000-0000-0000-000000000000');
        const res = await supertest(app.server)
            .post('/api/v1/whatsapp/disparos')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ leads_ids: ids, mensagem: 'Olá!' });
        expect(res.status).toBe(400);
    });
});




describe('GET /api/v1/whatsapp/conversas', () => {
    it('deve retornar lista vazia inicialmente', async () => {
        const res = await supertest(app.server)
            .get('/api/v1/whatsapp/conversas')
            .set('Authorization', `Bearer ${tokenA}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
    });

    it('deve retornar 401 sem token', async () => {
        const res = await supertest(app.server).get('/api/v1/whatsapp/conversas');
        expect(res.status).toBe(401);
    });
});


describe('GET /api/v1/whatsapp/automacoes', () => {
    it('deve listar somente automações do usuário', async () => {
        await supertest(app.server).post('/api/v1/whatsapp/automacoes')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ nome: 'Auto A', ativo: false });

        await supertest(app.server).post('/api/v1/whatsapp/automacoes')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ nome: 'Auto B', ativo: false });

        const res = await supertest(app.server)
            .get('/api/v1/whatsapp/automacoes')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe('Auto A');
    });
});



describe('DELETE /api/v1/whatsapp/automacoes/:id', () => {
    it('deve deletar automação e retornar 204', async () => {
        const created = await supertest(app.server).post('/api/v1/whatsapp/automacoes')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ nome: 'Para deletar', ativo: false });

        const res = await supertest(app.server)
            .delete(`/api/v1/whatsapp/automacoes/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.status).toBe(204);
    });

    it('usuário B não deleta automação do usuário A', async () => {
        const created = await supertest(app.server).post('/api/v1/whatsapp/automacoes')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ nome: 'Protegida', ativo: false });

        const res = await supertest(app.server)
            .delete(`/api/v1/whatsapp/automacoes/${created.body.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.status).toBe(404);
    });
});

describe('POST /api/v1/whatsapp/webhook', () => {
    it('deve aceitar webhook público sem token', async () => {
        const res = await supertest(app.server)
            .post('/api/v1/whatsapp/webhook')
            .send({ event: 'connection.update', instance: 'teste' });
        expect(res.status).toBe(200);
    });
});