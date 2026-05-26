"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../database/client");
const whatsapp_db_schema_1 = require("./whatsapp.db.schema");
const auth_schema_1 = require("../auth/auth.schema");
exports.whatsappRepository = {
    // ── CONVERSAS ──────────────────────────────────
    async findOrCreateConversa(userId, telefone, nome) {
        const existing = await client_1.db.select().from(whatsapp_db_schema_1.conversas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.conversas.user_id, userId), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.conversas.telefone, telefone)));
        if (existing[0])
            return existing[0];
        const [nova] = await client_1.db.insert(whatsapp_db_schema_1.conversas)
            .values({ user_id: userId, telefone, nome: nome ?? telefone })
            .returning();
        return nova;
    },
    async listConversas(userId, status, limit = 100, offset = 0) {
        return client_1.db.select().from(whatsapp_db_schema_1.conversas)
            .where(status
            ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.conversas.user_id, userId), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.conversas.status, status))
            : (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.conversas.user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(whatsapp_db_schema_1.conversas.ultima_msg_em))
            .limit(limit)
            .offset(offset);
    },
    async updateConversa(id, userId, data) {
        const [c] = await client_1.db.update(whatsapp_db_schema_1.conversas)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.conversas.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.conversas.user_id, userId)))
            .returning();
        return c ?? null;
    },
    // ── MENSAGENS ──────────────────────────────────
    async saveMensagem(data) {
        const [msg] = await client_1.db.insert(whatsapp_db_schema_1.mensagens).values({
            user_id: data.user_id,
            conversa_id: data.conversa_id,
            telefone: data.telefone,
            direcao: data.direcao,
            conteudo: data.conteudo,
            tipo: data.tipo ?? 'texto',
            wam_id: data.wam_id,
        }).returning();
        return msg;
    },
    async listMensagens(conversaId, userId, limit = 100, offset = 0) {
        return client_1.db.select().from(whatsapp_db_schema_1.mensagens)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.mensagens.conversa_id, conversaId), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.mensagens.user_id, userId)))
            .orderBy(whatsapp_db_schema_1.mensagens.created_at)
            .limit(limit)
            .offset(offset);
    },
    async existsMensagemByWamId(wamId) {
        const result = await client_1.db.select({ id: whatsapp_db_schema_1.mensagens.id })
            .from(whatsapp_db_schema_1.mensagens)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.mensagens.wam_id, wamId))
            .limit(1);
        return result.length > 0;
    },
    // ── DISPAROS ──────────────────────────────────
    async createDisparo(userId, data) {
        const [d] = await client_1.db.insert(whatsapp_db_schema_1.disparos)
            .values({ ...data, user_id: userId })
            .returning();
        return d;
    },
    async updateDisparo(id, userId, data) {
        const [d] = await client_1.db.update(whatsapp_db_schema_1.disparos)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparos.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparos.user_id, userId)))
            .returning();
        return d ?? null;
    },
    async findDisparoById(id, userId) {
        const result = await client_1.db.select().from(whatsapp_db_schema_1.disparos)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparos.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparos.user_id, userId)));
        return result[0] ?? null;
    },
    async listDisparos(userId, limit = 50, offset = 0) {
        return client_1.db.select().from(whatsapp_db_schema_1.disparos)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparos.user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(whatsapp_db_schema_1.disparos.created_at))
            .limit(limit)
            .offset(offset);
    },
    // ── DISPARO LOGS ──────────────────────────────
    async saveDisparoLog(data) {
        const [log] = await client_1.db.insert(whatsapp_db_schema_1.disparoLogs).values(data).returning();
        return log;
    },
    async listDisparoLogs(userId, limit = 100, offset = 0) {
        return client_1.db.select().from(whatsapp_db_schema_1.disparoLogs)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparoLogs.user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(whatsapp_db_schema_1.disparoLogs.sent_at))
            .limit(limit)
            .offset(offset);
    },
    // ── LIMITE DIÁRIO ──────────────────────────────
    async getLimiteDiario(userId) {
        const hoje = new Date().toISOString().split('T')[0];
        const result = await client_1.db.select().from(whatsapp_db_schema_1.disparosDiarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparosDiarios.user_id, userId), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparosDiarios.data, hoje)));
        const usado = result[0]?.quantidade ?? 0;
        return { usado, limite: 20, restante: Math.max(0, 20 - usado) };
    },
    async incrementarLimiteDiario(userId, quantidade) {
        const hoje = new Date().toISOString().split('T')[0];
        const existing = await client_1.db.select().from(whatsapp_db_schema_1.disparosDiarios)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparosDiarios.user_id, userId), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparosDiarios.data, hoje)));
        if (existing[0]) {
            await client_1.db.update(whatsapp_db_schema_1.disparosDiarios)
                .set({ quantidade: (existing[0].quantidade ?? 0) + quantidade })
                .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.disparosDiarios.id, existing[0].id));
        }
        else {
            await client_1.db.insert(whatsapp_db_schema_1.disparosDiarios).values({ user_id: userId, data: hoje, quantidade });
        }
    },
    // ── FUNIS DE DISPARO ──────────────────────────
    async listFunis(userId) {
        const list = await client_1.db.select().from(whatsapp_db_schema_1.funis)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funis.user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(whatsapp_db_schema_1.funis.created_at));
        return Promise.all(list.map(async (f) => {
            const etapas = await client_1.db.select().from(whatsapp_db_schema_1.funilEtapas)
                .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funilEtapas.funil_id, f.id))
                .orderBy(whatsapp_db_schema_1.funilEtapas.ordem);
            return { ...f, etapas };
        }));
    },
    async findFunilById(id, userId) {
        const result = await client_1.db.select().from(whatsapp_db_schema_1.funis)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funis.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funis.user_id, userId)));
        if (!result[0])
            return null;
        const etapas = await client_1.db.select().from(whatsapp_db_schema_1.funilEtapas)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funilEtapas.funil_id, id))
            .orderBy(whatsapp_db_schema_1.funilEtapas.ordem);
        return { ...result[0], etapas };
    },
    async createFunil(userId, data) {
        const [funil] = await client_1.db.insert(whatsapp_db_schema_1.funis)
            .values({ nome: data.nome, descricao: data.descricao, user_id: userId })
            .returning();
        const etapas = data.etapas.length
            ? await client_1.db.insert(whatsapp_db_schema_1.funilEtapas)
                .values(data.etapas.map(e => ({ ...e, funil_id: funil.id })))
                .returning()
            : [];
        return { ...funil, etapas };
    },
    async updateFunil(id, userId, data) {
        const [updated] = await client_1.db.update(whatsapp_db_schema_1.funis)
            .set({ nome: data.nome, descricao: data.descricao, updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funis.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funis.user_id, userId)))
            .returning();
        if (!updated)
            return null;
        await client_1.db.delete(whatsapp_db_schema_1.funilEtapas).where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funilEtapas.funil_id, id));
        const etapas = data.etapas.length
            ? await client_1.db.insert(whatsapp_db_schema_1.funilEtapas)
                .values(data.etapas.map(e => ({ ...e, funil_id: id })))
                .returning()
            : [];
        return { ...updated, etapas };
    },
    async deleteFunil(id, userId) {
        const [deleted] = await client_1.db.delete(whatsapp_db_schema_1.funis)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funis.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funis.user_id, userId)))
            .returning();
        return deleted ?? null;
    },
    async listEtapasByFunilId(funilId) {
        return client_1.db.select().from(whatsapp_db_schema_1.funilEtapas)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.funilEtapas.funil_id, funilId))
            .orderBy(whatsapp_db_schema_1.funilEtapas.ordem);
    },
    // ── AUTOMATION FLOWS ──────────────────────────
    async listFlows(userId) {
        return client_1.db.select().from(whatsapp_db_schema_1.automationFlows)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(whatsapp_db_schema_1.automationFlows.created_at));
    },
    async findFlowById(id, userId) {
        const result = await client_1.db.select().from(whatsapp_db_schema_1.automationFlows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.user_id, userId)));
        return result[0] ?? null;
    },
    async createFlow(userId, data) {
        const [flow] = await client_1.db.insert(whatsapp_db_schema_1.automationFlows)
            .values({ ...data, user_id: userId })
            .returning();
        return flow;
    },
    async updateFlow(id, userId, data) {
        const [flow] = await client_1.db.update(whatsapp_db_schema_1.automationFlows)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.user_id, userId)))
            .returning();
        return flow ?? null;
    },
    async deleteFlow(id, userId) {
        const [flow] = await client_1.db.delete(whatsapp_db_schema_1.automationFlows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.user_id, userId)))
            .returning();
        return flow ?? null;
    },
    // ── AUTOMATION NODES ──────────────────────────
    async listNodes(flowId) {
        return client_1.db.select().from(whatsapp_db_schema_1.automationNodes)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationNodes.flow_id, flowId))
            .orderBy(whatsapp_db_schema_1.automationNodes.order_index);
    },
    async createNode(data) {
        const [node] = await client_1.db.insert(whatsapp_db_schema_1.automationNodes)
            .values(data)
            .returning();
        return node;
    },
    async updateNode(id, data) {
        const [node] = await client_1.db.update(whatsapp_db_schema_1.automationNodes)
            .set(data)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationNodes.id, id))
            .returning();
        return node ?? null;
    },
    async deleteNode(id) {
        const [node] = await client_1.db.delete(whatsapp_db_schema_1.automationNodes)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationNodes.id, id))
            .returning();
        return node ?? null;
    },
    // ── AUTOMATION SESSIONS ───────────────────────
    async findSession(instanceName, phone) {
        const result = await client_1.db.select().from(whatsapp_db_schema_1.automationSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationSessions.instance_name, instanceName), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationSessions.phone, phone), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationSessions.status, 'active')));
        return result[0] ?? null;
    },
    async createSession(data) {
        const [session] = await client_1.db.insert(whatsapp_db_schema_1.automationSessions)
            .values(data)
            .returning();
        return session;
    },
    async updateSession(id, data) {
        const [session] = await client_1.db.update(whatsapp_db_schema_1.automationSessions)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationSessions.id, id))
            .returning();
        return session ?? null;
    },
    // ── AUTOMAÇÕES (legado — compatibilidade) ─────
    async listAutomacoes(userId) {
        return this.listFlows(userId);
    },
    async createAutomacao(userId, data) {
        const instanceName = `inst-${userId.split('-')[0]}`;
        return this.createFlow(userId, {
            name: data.nome ?? 'Nova automação',
            status: 'rascunho',
            trigger_type: data.trigger ?? 'always',
            instance_name: instanceName,
        });
    },
    async updateAutomacao(id, userId, data) {
        return this.updateFlow(id, userId, {
            name: data.nome,
            trigger_type: data.trigger,
        });
    },
    async deleteAutomacao(id, userId) {
        return this.deleteFlow(id, userId);
    },
    // ── FLOW ENGINE — métodos de suporte ──────────────────────────────────────
    // Descobre o user_id pelo instance_name
    // Ordem: flows → padrão inst-{prefixo} → scan ia_config ativo
    async findUserByInstanceName(instanceName) {
        // 1. Tenta por flows (compatibilidade com automações)
        const fromFlow = await client_1.db
            .select({ user_id: whatsapp_db_schema_1.automationFlows.user_id })
            .from(whatsapp_db_schema_1.automationFlows)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.instance_name, instanceName))
            .limit(1);
        if (fromFlow[0])
            return fromFlow[0];
        // 2. Padrão SaaS: inst-{primeiros 8 chars do userId}
        //    ex: inst-dd28655c → userId começa com dd28655c
        if (instanceName.startsWith('inst-')) {
            const prefix = instanceName.slice(5); // remove "inst-"
            const fromUser = await client_1.db
                .select({ user_id: auth_schema_1.users.id })
                .from(auth_schema_1.users)
                .where((0, drizzle_orm_1.sql) `${auth_schema_1.users.id}::text LIKE ${prefix + '%'}`)
                .limit(1);
            if (fromUser[0])
                return { user_id: fromUser[0].user_id };
        }
        // 3. Fallback: qualquer ia_config ativo que inclua essa instância
        const configs = await client_1.db
            .select({ user_id: whatsapp_db_schema_1.iaConfig.user_id, instancias: whatsapp_db_schema_1.iaConfig.instancias })
            .from(whatsapp_db_schema_1.iaConfig)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.iaConfig.ativo, true));
        for (const cfg of configs) {
            const lista = cfg.instancias ?? [];
            if (lista.length === 0 || lista.includes(instanceName)) {
                return { user_id: cfg.user_id };
            }
        }
        return null;
    },
    // Retorna todos os flows ativos de uma instância
    async findActiveFlowsByInstance(instanceName) {
        return client_1.db.select().from(whatsapp_db_schema_1.automationFlows)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.instance_name, instanceName), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationFlows.status, 'ativo')));
    },
    // Busca um nó pelo ID
    async findNodeById(nodeId) {
        const result = await client_1.db.select().from(whatsapp_db_schema_1.automationNodes)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationNodes.id, nodeId));
        return result[0] ?? null;
    },
    // Retorna o nó de início (type = 'start') de um flow
    async findStartNode(flowId) {
        const result = await client_1.db.select().from(whatsapp_db_schema_1.automationNodes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationNodes.flow_id, flowId), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationNodes.type, 'start')))
            .orderBy(whatsapp_db_schema_1.automationNodes.order_index)
            .limit(1);
        return result[0] ?? null;
    },
    // Conta sessões finalizadas para checar trigger 'primeira_mensagem'
    async countFinishedSessions(instanceName, phone) {
        const result = await client_1.db.select({ total: (0, drizzle_orm_1.count)() }).from(whatsapp_db_schema_1.automationSessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationSessions.instance_name, instanceName), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationSessions.phone, phone), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationSessions.status, 'finished')));
        return result[0]?.total ?? 0;
    },
    // Retorna as variáveis de uma sessão (respostas coletadas)
    async getSessionVariables(sessionId) {
        const result = await client_1.db.select({ variables: whatsapp_db_schema_1.automationSessions.variables })
            .from(whatsapp_db_schema_1.automationSessions)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.automationSessions.id, sessionId));
        return result[0]?.variables ?? {};
    },
    // Atualiza conversa diretamente pelo ID (sem exigir user_id no where)
    async updateConversaById(id, userId, data) {
        const [c] = await client_1.db.update(whatsapp_db_schema_1.conversas)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.conversas.id, id), (0, drizzle_orm_1.eq)(whatsapp_db_schema_1.conversas.user_id, userId)))
            .returning();
        return c ?? null;
    },
    // ── IA CONFIG ─────────────────────────────────────
    async getIaConfigByUserId(userId) {
        const result = await client_1.db.select().from(whatsapp_db_schema_1.iaConfig)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.iaConfig.user_id, userId));
        return result[0] ?? null;
    },
    async getIaConfigByInstanceName(instanceName) {
        const result = await client_1.db.select().from(whatsapp_db_schema_1.iaConfig)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.iaConfig.instance_name, instanceName));
        return result[0] ?? null;
    },
    async upsertIaConfig(userId, instanceName, data) {
        const existing = await client_1.db.select({ id: whatsapp_db_schema_1.iaConfig.id }).from(whatsapp_db_schema_1.iaConfig)
            .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.iaConfig.user_id, userId));
        if (existing[0]) {
            const [updated] = await client_1.db.update(whatsapp_db_schema_1.iaConfig)
                .set({ ...data, instance_name: instanceName, updated_at: new Date() })
                .where((0, drizzle_orm_1.eq)(whatsapp_db_schema_1.iaConfig.user_id, userId))
                .returning();
            return updated;
        }
        const [created] = await client_1.db.insert(whatsapp_db_schema_1.iaConfig)
            .values({ ...data, user_id: userId, instance_name: instanceName })
            .returning();
        return created;
    },
};
//# sourceMappingURL=whatsapp.repository.js.map