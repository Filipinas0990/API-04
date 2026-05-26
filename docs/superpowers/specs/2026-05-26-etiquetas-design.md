# Design: Sistema de Etiquetas (Tags) para Leads

**Data:** 2026-05-26
**Status:** Aprovado

## Visão Geral

Feature de etiquetas para leads, disponível em todos os planos. Um lead pode ter múltiplas etiquetas. Etiquetas podem ser aplicadas manualmente (pelo pipeline) ou automaticamente (via keyword em mensagem WhatsApp).

---

## Banco de Dados

### Tabela `etiquetas`

Catálogo de tags pertencentes ao usuário.

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → users, NOT NULL |
| name | text | NOT NULL |
| color | text | hex color, ex: "#6366f1" |
| icon | text | nome do ícone, ex: "tag", "megaphone" |
| keyword_trigger | text | nullable — se definido, ativa auto-tag |
| keyword_type | text | default 'contains' |
| created_at | timestamp | default now() |
| updated_at | timestamp | default now() |

### Tabela `lead_etiquetas`

Relação N:N entre leads e etiquetas.

| Coluna | Tipo | Notas |
|---|---|---|
| lead_id | uuid | FK → leads ON DELETE CASCADE |
| etiqueta_id | uuid | FK → etiquetas ON DELETE CASCADE |
| created_at | timestamp | default now() |

PK composta: `(lead_id, etiqueta_id)`

---

## Módulo: `src/modules/etiquetas/`

### Arquivos
- `etiqueta.db.schema.ts` — schemas Drizzle das duas tabelas
- `etiqueta.repository.ts` — queries (list, create, update, delete, stats, addToLead, removeFromLead)
- `etiqueta.controller.ts` — handlers HTTP
- `etiqueta.routes.ts` — registro de rotas com auth middleware
- `etiqueta.schema.ts` — schemas Zod para validação

### API Endpoints

```
GET    /api/v1/etiquetas              → lista etiquetas do usuário autenticado
POST   /api/v1/etiquetas              → cria etiqueta
PUT    /api/v1/etiquetas/:id          → atualiza etiqueta
DELETE /api/v1/etiquetas/:id          → deleta etiqueta (cascade em lead_etiquetas)
GET    /api/v1/etiquetas/stats        → série temporal últimos 7 dias por etiqueta
```

### Formato de resposta: `GET /api/v1/etiquetas`

```json
[
  {
    "id": "uuid",
    "name": "Facebook",
    "color": "#6366f1",
    "icon": "megaphone",
    "keyword_trigger": "meta-ads",
    "keyword_type": "contains",
    "created_at": "2026-05-26T..."
  }
]
```

### Formato de resposta: `GET /api/v1/etiquetas/stats`

```json
[
  {
    "etiqueta_id": "uuid",
    "name": "Facebook",
    "color": "#6366f1",
    "total_leads": 5,
    "series": [
      { "date": "2026-05-20", "count": 2 },
      { "date": "2026-05-21", "count": 0 },
      { "date": "2026-05-22", "count": 1 },
      { "date": "2026-05-23", "count": 0 },
      { "date": "2026-05-24", "count": 1 },
      { "date": "2026-05-25", "count": 1 },
      { "date": "2026-05-26", "count": 0 }
    ]
  }
]
```

---

## Extensões no Módulo de Leads

### Novos endpoints

```
POST   /api/v1/leads/:id/etiquetas/:etiquetaId   → aplica etiqueta ao lead
DELETE /api/v1/leads/:id/etiquetas/:etiquetaId   → remove etiqueta do lead
```

Ambos validam que a etiqueta pertence ao mesmo `user_id` do lead para evitar cross-user contamination.

### Mudanças nas respostas existentes

`GET /api/v1/leads`, `GET /api/v1/leads/pipeline`, `GET /api/v1/leads/:id` passam a incluir:

```json
"etiquetas": [
  { "id": "uuid", "name": "VIP", "color": "#f59e0b", "icon": "tag" }
]
```

A query do pipeline faz LEFT JOIN com `lead_etiquetas` e `etiquetas` para evitar N+1.

---

## Auto-tag via Keyword

### Localização

Integrado em `src/modules/whatAapp/assistente.service.ts`, no ponto em que uma nova mensagem de um lead é processada.

### Lógica

```
1. Após receber mensagem do lead, busca user_id do lead
2. Carrega todas as etiquetas do usuário com keyword_trigger não-nulo
3. Para cada etiqueta: verifica se message.toLowerCase().includes(keyword.toLowerCase())
4. Se match e lead ainda não tem a etiqueta → INSERT em lead_etiquetas (ignorar conflito via ON CONFLICT DO NOTHING)
```

Executado de forma assíncrona após o processamento principal — não bloqueia resposta ao lead.

---

## Pipeline — Menu de Ações

Adicionar opção "Adicionar etiqueta" ao menu "..." existente nos cards do kanban:

```
🏷 Adicionar etiqueta    ← novo
   Mover para Bolsão
🗑 Excluir lead
```

Ao clicar: abre modal com lista de etiquetas do usuário. Etiquetas já aplicadas ao lead aparecem selecionadas. Clicar numa etiqueta faz toggle (add ou remove via API).

---

## Registro do Módulo

Em `src/shared/server.ts`, registrar as rotas de etiquetas:

```typescript
import { etiquetasRoutes } from '../modules/etiquetas/etiqueta.routes';
// ...
app.register(etiquetasRoutes, { prefix: '/api/v1' });
```

Em `src/database/shema.ts`, exportar os novos schemas Drizzle.

---

## Restrições de Plano

Nenhuma — disponível em todos os planos (basic, premium, gold).

---

## Considerações de Segurança

- Todos os endpoints exigem autenticação via `authMiddleware`
- Ao aplicar etiqueta a um lead, validar que `etiqueta.user_id === lead.user_id`
- Ao retornar etiquetas, filtrar sempre por `user_id` do usuário autenticado
