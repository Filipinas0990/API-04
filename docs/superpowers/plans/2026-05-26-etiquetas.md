# Etiquetas (Tags) para Leads — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema completo de etiquetas (tags) para leads — CRUD de etiquetas, aplicação manual via pipeline, auto-tag por keyword WhatsApp, e gráfico de desempenho.

**Architecture:** Novo módulo `src/modules/etiquetas/` com tabelas `etiquetas` (catálogo por usuário) e `lead_etiquetas` (N:N). As respostas de leads passam a incluir `etiquetas: []`. A auto-tag é integrada assincronamente no `ia-auto-responder.service.ts` após o processamento da mensagem.

**Tech Stack:** Fastify, Drizzle ORM 0.45 (postgres-js), Zod 4, Vitest + Supertest.

---

## File Structure

### Novos arquivos
- `drizzle/0009_etiquetas.sql` — migration SQL das duas tabelas
- `src/modules/etiquetas/etiqueta.db.schema.ts` — schemas Drizzle (`etiquetas`, `leadEtiquetas`)
- `src/modules/etiquetas/etiqueta.schema.ts` — schemas Zod para validação
- `src/modules/etiquetas/etiqueta.repository.ts` — CRUD + stats + addToLead/removeFromLead
- `src/modules/etiquetas/etiqueta.controller.ts` — handlers HTTP
- `src/modules/etiquetas/etiqueta.routes.ts` — registro de rotas
- `tests/modules/etiquetas.test.ts` — testes de integração

### Arquivos modificados
- `src/database/shema.ts` — exportar novos schemas
- `src/shared/server.ts` — registrar `etiquetasRoutes`
- `src/modules/leads/lead.repository.ts` — enriquecer respostas com `etiquetas: []`
- `src/modules/leads/lead.routes.ts` — adicionar POST/DELETE `/:id/etiquetas/:etiquetaId`
- `src/modules/whatAapp/ia-auto-responder.service.ts` — auto-tag por keyword

---

## Task 1: Migration SQL

**Files:**
- Create: `drizzle/0009_etiquetas.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
CREATE TABLE IF NOT EXISTS "etiquetas" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "color" text NOT NULL DEFAULT '#6366f1',
    "icon" text NOT NULL DEFAULT 'tag',
    "keyword_trigger" text,
    "keyword_type" text NOT NULL DEFAULT 'contains',
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "lead_etiquetas" (
    "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
    "etiqueta_id" uuid NOT NULL REFERENCES "etiquetas"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "lead_etiquetas_pk" PRIMARY KEY ("lead_id", "etiqueta_id")
);
```

- [ ] **Step 2: Aplicar migration no banco de desenvolvimento**

```bash
npm run db:migrate
```

Expected: `✓ Migrations applied` (ou similar do drizzle-kit)

- [ ] **Step 3: Aplicar migration no banco de teste**

```bash
npm run db:migrate:test
```

Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add drizzle/0009_etiquetas.sql
git commit -m "feat: migration - tabelas etiquetas e lead_etiquetas"
```

---

## Task 2: Drizzle Schema

**Files:**
- Create: `src/modules/etiquetas/etiqueta.db.schema.ts`

- [ ] **Step 1: Criar o schema Drizzle**

```typescript
import { pgTable, uuid, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users } from '../auth/auth.schema';
import { leads } from '../leads/lead.db.schema';

export const etiquetas = pgTable('etiquetas', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('#6366f1'),
    icon: text('icon').notNull().default('tag'),
    keyword_trigger: text('keyword_trigger'),
    keyword_type: text('keyword_type').notNull().default('contains'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const leadEtiquetas = pgTable('lead_etiquetas', {
    lead_id: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    etiqueta_id: uuid('etiqueta_id').notNull().references(() => etiquetas.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at').defaultNow(),
}, (t) => [
    primaryKey({ columns: [t.lead_id, t.etiqueta_id] }),
]);
```

- [ ] **Step 2: Exportar do schema central**

Em `src/database/shema.ts`, adicionar no final:

```typescript
export * from '../modules/etiquetas/etiqueta.db.schema';
```

- [ ] **Step 3: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add src/modules/etiquetas/etiqueta.db.schema.ts src/database/shema.ts
git commit -m "feat: drizzle schema - etiquetas e lead_etiquetas"
```

---

## Task 3: Zod Validation Schemas

**Files:**
- Create: `src/modules/etiquetas/etiqueta.schema.ts`

- [ ] **Step 1: Criar schemas Zod**

```typescript
import { z } from 'zod';

export const createEtiquetaSchema = z.object({
    name: z.string().min(1).max(50).trim(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
    icon: z.string().default('tag'),
    keyword_trigger: z.string().trim().optional(),
    keyword_type: z.enum(['contains']).default('contains'),
});

export const updateEtiquetaSchema = createEtiquetaSchema.partial();

export type CreateEtiquetaDTO = z.infer<typeof createEtiquetaSchema>;
export type UpdateEtiquetaDTO = z.infer<typeof updateEtiquetaSchema>;
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/modules/etiquetas/etiqueta.schema.ts
git commit -m "feat: zod schemas para etiquetas"
```

---

## Task 4: Repository

**Files:**
- Create: `src/modules/etiquetas/etiqueta.repository.ts`

- [ ] **Step 1: Criar o repository**

```typescript
import { eq, and, inArray, sql } from 'drizzle-orm';
import { db } from '../../database/client';
import { etiquetas, leadEtiquetas } from './etiqueta.db.schema';

export const etiquetaRepository = {
    async findAll(userId: string) {
        return db
            .select()
            .from(etiquetas)
            .where(eq(etiquetas.user_id, userId))
            .orderBy(etiquetas.created_at);
    },

    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(etiquetas)
            .where(and(eq(etiquetas.id, id), eq(etiquetas.user_id, userId)));
        return result[0] ?? null;
    },

    async create(userId: string, data: {
        name: string;
        color: string;
        icon: string;
        keyword_trigger?: string;
        keyword_type: string;
    }) {
        const [etiqueta] = await db
            .insert(etiquetas)
            .values({ ...data, user_id: userId })
            .returning();
        return etiqueta;
    },

    async update(id: string, userId: string, data: Partial<{
        name: string;
        color: string;
        icon: string;
        keyword_trigger: string;
        keyword_type: string;
    }>) {
        const [etiqueta] = await db
            .update(etiquetas)
            .set({ ...data, updated_at: new Date() })
            .where(and(eq(etiquetas.id, id), eq(etiquetas.user_id, userId)))
            .returning();
        return etiqueta ?? null;
    },

    async delete(id: string, userId: string) {
        const [etiqueta] = await db
            .delete(etiquetas)
            .where(and(eq(etiquetas.id, id), eq(etiquetas.user_id, userId)))
            .returning();
        return etiqueta ?? null;
    },

    async addToLead(leadId: string, etiquetaId: string) {
        await db
            .insert(leadEtiquetas)
            .values({ lead_id: leadId, etiqueta_id: etiquetaId })
            .onConflictDoNothing();
    },

    async removeFromLead(leadId: string, etiquetaId: string) {
        await db
            .delete(leadEtiquetas)
            .where(
                and(
                    eq(leadEtiquetas.lead_id, leadId),
                    eq(leadEtiquetas.etiqueta_id, etiquetaId),
                ),
            );
    },

    async fetchForLeads(leadIds: string[]) {
        if (leadIds.length === 0) return new Map<string, { id: string; name: string; color: string; icon: string }[]>();

        const rows = await db
            .select({
                lead_id: leadEtiquetas.lead_id,
                id: etiquetas.id,
                name: etiquetas.name,
                color: etiquetas.color,
                icon: etiquetas.icon,
            })
            .from(leadEtiquetas)
            .innerJoin(etiquetas, eq(leadEtiquetas.etiqueta_id, etiquetas.id))
            .where(inArray(leadEtiquetas.lead_id, leadIds));

        const map = new Map<string, { id: string; name: string; color: string; icon: string }[]>();
        for (const row of rows) {
            const { lead_id, ...tag } = row;
            if (!map.has(lead_id)) map.set(lead_id, []);
            map.get(lead_id)!.push(tag);
        }
        return map;
    },

    async findWithKeywords(userId: string) {
        return db
            .select()
            .from(etiquetas)
            .where(
                and(
                    eq(etiquetas.user_id, userId),
                    sql`${etiquetas.keyword_trigger} IS NOT NULL`,
                ),
            );
    },

    async getStats(userId: string) {
        const allEtiquetas = await db
            .select()
            .from(etiquetas)
            .where(eq(etiquetas.user_id, userId))
            .orderBy(etiquetas.created_at);

        const today = new Date(Date.now() - 3 * 60 * 60 * 1000); // Brasília UTC-3
        const days: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }

        const result = await Promise.all(
            allEtiquetas.map(async (e) => {
                const rows = await db.execute(sql`
                    SELECT
                        TO_CHAR(le.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS date,
                        COUNT(*)::int AS count
                    FROM lead_etiquetas le
                    WHERE le.etiqueta_id = ${e.id}
                        AND le.created_at >= NOW() - INTERVAL '7 days'
                    GROUP BY TO_CHAR(le.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
                `);

                const countsMap = new Map<string, number>();
                for (const row of rows as { date: string; count: number }[]) {
                    countsMap.set(row.date, Number(row.count));
                }

                const series = days.map(date => ({ date, count: countsMap.get(date) ?? 0 }));
                const total_leads = series.reduce((sum, s) => sum + s.count, 0);

                return { etiqueta_id: e.id, name: e.name, color: e.color, total_leads, series };
            }),
        );

        return result;
    },
};
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/modules/etiquetas/etiqueta.repository.ts
git commit -m "feat: etiqueta repository com CRUD, stats e fetchForLeads"
```

---

## Task 5: Controller e Routes

**Files:**
- Create: `src/modules/etiquetas/etiqueta.controller.ts`
- Create: `src/modules/etiquetas/etiqueta.routes.ts`

- [ ] **Step 1: Criar o controller**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { createEtiquetaSchema, updateEtiquetaSchema } from './etiqueta.schema';
import { etiquetaRepository } from './etiqueta.repository';
import { leadRepository } from '../leads/lead.repository';

export const etiquetaController = {
    async list(req: FastifyRequest, reply: FastifyReply) {
        const result = await etiquetaRepository.findAll(req.user.id);
        return reply.send(result);
    },

    async create(req: FastifyRequest, reply: FastifyReply) {
        const data = createEtiquetaSchema.parse(req.body);
        const etiqueta = await etiquetaRepository.create(req.user.id, data);
        return reply.status(201).send(etiqueta);
    },

    async update(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = updateEtiquetaSchema.parse(req.body);
        const etiqueta = await etiquetaRepository.update(id, req.user.id, data);
        if (!etiqueta) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Etiqueta não encontrada' });
        }
        return reply.send(etiqueta);
    },

    async remove(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const etiqueta = await etiquetaRepository.delete(id, req.user.id);
        if (!etiqueta) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Etiqueta não encontrada' });
        }
        return reply.status(204).send();
    },

    async getStats(req: FastifyRequest, reply: FastifyReply) {
        const stats = await etiquetaRepository.getStats(req.user.id);
        return reply.send(stats);
    },

    async addToLead(req: FastifyRequest, reply: FastifyReply) {
        const { id: leadId, etiquetaId } = req.params as { id: string; etiquetaId: string };

        const lead = await leadRepository.findById(leadId, req.user.id);
        if (!lead) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lead não encontrado' });
        }

        const etiqueta = await etiquetaRepository.findById(etiquetaId, req.user.id);
        if (!etiqueta) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Etiqueta não encontrada' });
        }

        await etiquetaRepository.addToLead(leadId, etiquetaId);
        return reply.status(201).send({ ok: true });
    },

    async removeFromLead(req: FastifyRequest, reply: FastifyReply) {
        const { id: leadId, etiquetaId } = req.params as { id: string; etiquetaId: string };

        const lead = await leadRepository.findById(leadId, req.user.id);
        if (!lead) {
            return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Lead não encontrado' });
        }

        await etiquetaRepository.removeFromLead(leadId, etiquetaId);
        return reply.status(204).send();
    },
};
```

- [ ] **Step 2: Criar as routes**

```typescript
import { FastifyInstance } from 'fastify';
import { etiquetaController } from './etiqueta.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function etiquetasRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', etiquetaController.list);
    app.post('/', etiquetaController.create);
    app.get('/stats', etiquetaController.getStats);
    app.put('/:id', etiquetaController.update);
    app.delete('/:id', etiquetaController.remove);
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add src/modules/etiquetas/etiqueta.controller.ts src/modules/etiquetas/etiqueta.routes.ts
git commit -m "feat: etiqueta controller e routes"
```

---

## Task 6: Registrar módulo no servidor

**Files:**
- Modify: `src/shared/server.ts`

- [ ] **Step 1: Adicionar import e registro em `src/shared/server.ts`**

Adicionar o import após a linha `import { subscriptionRoutes } from '../modules/subscription/subscription.routes';`:

```typescript
import { etiquetasRoutes } from '../modules/etiquetas/etiqueta.routes';
```

Adicionar o registro após `app.register(subscriptionRoutes, { prefix: '/api/v1' });`:

```typescript
app.register(etiquetasRoutes, { prefix: '/api/v1/etiquetas' });
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Testar healthcheck e inicialização**

```bash
npm run dev
```

Em outro terminal:
```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok",...}`

- [ ] **Step 4: Commit**

```bash
git add src/shared/server.ts
git commit -m "feat: registrar etiquetasRoutes no servidor"
```

---

## Task 7: Enriquecer respostas de leads com etiquetas

**Files:**
- Modify: `src/modules/leads/lead.repository.ts`

Os métodos `findAll`, `findById` e `getPipeline` passam a incluir `etiquetas: []` usando `etiquetaRepository.fetchForLeads`.

- [ ] **Step 1: Atualizar `src/modules/leads/lead.repository.ts`**

Substituir o conteúdo inteiro do arquivo:

```typescript
import { eq, and, ilike, or } from 'drizzle-orm';
import { db } from '../../database/client';
import { leads } from './lead.db.schema';
import { etiquetaRepository } from '../etiquetas/etiqueta.repository';

async function withEtiquetas<T extends { id: string }>(items: T[]) {
    const map = await etiquetaRepository.fetchForLeads(items.map(i => i.id));
    return items.map(item => ({ ...item, etiquetas: map.get(item.id) ?? [] }));
}

export const leadRepository = {
    async findAll(userId: string, filters?: { search?: string; status?: string }) {
        const conditions = [eq(leads.user_id, userId)];

        if (filters?.status) {
            conditions.push(eq(leads.status, filters.status));
        }

        const allLeads = await db
            .select()
            .from(leads)
            .where(and(...conditions))
            .orderBy(leads.created_at);

        const filtered = filters?.search
            ? (() => {
                const search = filters.search!.toLowerCase();
                return allLeads.filter(
                    l =>
                        l.name.toLowerCase().includes(search) ||
                        l.telefone.includes(search) ||
                        (l.email?.toLowerCase().includes(search) ?? false),
                );
            })()
            : allLeads;

        return withEtiquetas(filtered);
    },

    async findByPhone(userId: string, telefone: string) {
        const result = await db
            .select()
            .from(leads)
            .where(and(eq(leads.user_id, userId), eq(leads.telefone, telefone)));
        return result[0] ?? null;
    },

    async findById(id: string, userId: string) {
        const result = await db
            .select()
            .from(leads)
            .where(and(eq(leads.id, id), eq(leads.user_id, userId)));
        if (!result[0]) return null;
        const [enriched] = await withEtiquetas([result[0]]);
        return enriched;
    },

    async create(userId: string, data: {
        name: string;
        telefone: string;
        email?: string;
        gestor_responsavel?: string;
        temperatura?: number;
        interesse?: string;
        observacoes?: string;
        status?: string;
    }) {
        const [lead] = await db
            .insert(leads)
            .values({ ...data, user_id: userId })
            .returning();
        return lead;
    },

    async update(id: string, userId: string, data: Partial<{
        name: string;
        telefone: string;
        email: string;
        gestor_responsavel: string;
        temperatura: number;
        interesse: string;
        observacoes: string;
        status: string;
    }>) {
        const [lead] = await db
            .update(leads)
            .set({ ...data, updated_at: new Date() })
            .where(and(eq(leads.id, id), eq(leads.user_id, userId)))
            .returning();
        return lead ?? null;
    },

    async delete(id: string, userId: string) {
        const [lead] = await db
            .delete(leads)
            .where(and(eq(leads.id, id), eq(leads.user_id, userId)))
            .returning();
        return lead ?? null;
    },

    async findByKanbanEtapa(userId: string, etapa: string) {
        return db
            .select()
            .from(leads)
            .where(and(eq(leads.user_id, userId), eq(leads.status, etapa)))
            .orderBy(leads.created_at);
    },

    async getPipeline(userId: string) {
        const allLeads = await db
            .select()
            .from(leads)
            .where(eq(leads.user_id, userId))
            .orderBy(leads.created_at);

        const enriched = await withEtiquetas(allLeads);

        return {
            novo_cliente: enriched.filter(l => l.status === 'novo_cliente'),
            em_contato: enriched.filter(l => l.status === 'em_contato'),
            visita_marcada: enriched.filter(l => l.status === 'visita_marcada'),
            proposta_enviada: enriched.filter(l => l.status === 'proposta_enviada'),
            cliente_desistiu: enriched.filter(l => l.status === 'cliente_desistiu'),
        };
    },
};
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/modules/leads/lead.repository.ts
git commit -m "feat: enriquecer respostas de leads com etiquetas"
```

---

## Task 8: Endpoints de etiqueta no lead (toggle)

**Files:**
- Modify: `src/modules/leads/lead.routes.ts`

- [ ] **Step 1: Adicionar import e rotas em `src/modules/leads/lead.routes.ts`**

Substituir o conteúdo inteiro do arquivo:

```typescript
import { FastifyInstance } from 'fastify';
import { leadController } from './lead.controller';
import { etiquetaController } from '../etiquetas/etiqueta.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export async function leadRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authMiddleware);

    app.get('/', leadController.list);
    app.post('/', leadController.create);
    app.get('/pipeline', leadController.getPipeline);
    app.get('/:id', leadController.getById);
    app.put('/:id', leadController.update);
    app.delete('/:id', leadController.remove);
    app.patch('/:id/status', leadController.updateStatus);
    app.post('/:id/etiquetas/:etiquetaId', etiquetaController.addToLead);
    app.delete('/:id/etiquetas/:etiquetaId', etiquetaController.removeFromLead);
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/modules/leads/lead.routes.ts
git commit -m "feat: endpoints POST/DELETE /:id/etiquetas/:etiquetaId em leads"
```

---

## Task 9: Auto-tag por keyword no WhatsApp

**Files:**
- Modify: `src/modules/whatAapp/ia-auto-responder.service.ts`

- [ ] **Step 1: Adicionar import do etiquetaRepository**

No topo de `src/modules/whatAapp/ia-auto-responder.service.ts`, após o import de `leadRepository`:

```typescript
import { etiquetaRepository } from '../etiquetas/etiqueta.repository';
```

- [ ] **Step 2: Adicionar auto-tag após enriquecimento de lead**

No método `handle`, após o bloco `if (userMessages.length > 0) { ... }` (aproximadamente linha 185–213), adicionar:

```typescript
// Auto-tag por keyword: aplica etiquetas cujo keyword_trigger está contido na mensagem recebida
void (async () => {
    try {
        const tagsComKeyword = await etiquetaRepository.findWithKeywords(userId);
        if (tagsComKeyword.length === 0) return;

        const lead = await leadRepository.findByPhone(userId, telefone);
        if (!lead) return;

        const msgLower = conteudo.toLowerCase();
        for (const tag of tagsComKeyword) {
            if (tag.keyword_trigger && msgLower.includes(tag.keyword_trigger.toLowerCase())) {
                await etiquetaRepository.addToLead(lead.id, tag.id);
            }
        }
    } catch (err) {
        console.error('[auto-tag] Erro ao aplicar etiqueta por keyword:', err);
    }
})();
```

O bloco `void (async () => { ... })()` garante execução assíncrona sem bloquear o retorno do `handle`.

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 4: Commit**

```bash
git add src/modules/whatAapp/ia-auto-responder.service.ts
git commit -m "feat: auto-tag por keyword no ia-auto-responder"
```

---

## Task 10: Testes de integração

**Files:**
- Create: `tests/modules/etiquetas.test.ts`

- [ ] **Step 1: Criar o arquivo de testes**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/shared/server';
import { db } from '../../src/database/client';
import { users, refreshTokens } from '../../src/modules/auth/auth.schema';
import { leads } from '../../src/modules/leads/lead.db.schema';
import { etiquetas, leadEtiquetas } from '../../src/modules/etiquetas/etiqueta.db.schema';

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
```

- [ ] **Step 2: Executar os testes (devem falhar — o código ainda não existe)**

```bash
npx dotenv-cli -e .env -- vitest run tests/modules/etiquetas.test.ts
```

Expected: FAIL — confirma que os testes estão corretamente exercitando o código

> **Nota:** Se todas as tasks anteriores (1–9) já foram implementadas, os testes devem PASSAR diretamente. Execute este step somente para confirmar.

- [ ] **Step 3: Executar suite completa para garantir sem regressões**

```bash
npx dotenv-cli -e .env -- vitest run
```

Expected: todos os testes passam, incluindo os existentes em `tests/modules/leads.test.ts`

- [ ] **Step 4: Commit**

```bash
git add tests/modules/etiquetas.test.ts
git commit -m "test: testes de integração para módulo de etiquetas"
```

---

## Self-Review

**Spec coverage:**
- ✅ Tabelas `etiquetas` e `lead_etiquetas` — Task 1 + 2
- ✅ CRUD de etiquetas — Tasks 3, 4, 5
- ✅ Registro no servidor — Task 6
- ✅ Etiquetas nas respostas de leads/pipeline — Task 7
- ✅ POST/DELETE `/:id/etiquetas/:etiquetaId` — Task 8
- ✅ Auto-tag por keyword WhatsApp — Task 9
- ✅ `GET /etiquetas/stats` com série temporal 7 dias — Tasks 4, 10
- ✅ Segurança: ownership check em todas as operações — Tasks 4, 5

**Sem placeholders.** Todos os steps contêm código completo.

**Consistência de tipos:**
- `etiquetaRepository.fetchForLeads` retorna `Map<string, { id, name, color, icon }[]>` — usado em `withEtiquetas` em Task 7 ✅
- `etiquetaRepository.addToLead(leadId, etiquetaId)` — chamado em Task 5 (controller) e Task 9 (auto-tag) com mesma assinatura ✅
- `etiquetaRepository.findWithKeywords(userId)` — retorna array de `etiquetas` com `keyword_trigger` não-nulo ✅
