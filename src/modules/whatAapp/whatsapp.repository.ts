import { eq, and, desc, count, sql } from 'drizzle-orm';
import { db } from '../../database/client';
import {
    conversas, mensagens, disparos, disparoLogs,
    disparosDiarios, funis, funilEtapas,
    automationFlows, automationNodes, automationSessions, iaConfig
} from './whatsapp.db.schema';
import { users } from '../auth/auth.schema';

export const whatsappRepository = {

    // ── CONVERSAS ──────────────────────────────────
    async findOrCreateConversa(userId: string, telefone: string, nome?: string) {
        const existing = await db.select().from(conversas)
            .where(and(eq(conversas.user_id, userId), eq(conversas.telefone, telefone)));
        if (existing[0]) return existing[0];
        const [nova] = await db.insert(conversas)
            .values({ user_id: userId, telefone, nome: nome ?? telefone })
            .returning();
        return nova;
    },

    async listConversas(userId: string, status?: string, limit = 100, offset = 0) {
        return db.select().from(conversas)
            .where(status
                ? and(eq(conversas.user_id, userId), eq(conversas.status, status))
                : eq(conversas.user_id, userId)
            )
            .orderBy(desc(conversas.ultima_msg_em))
            .limit(limit)
            .offset(offset);
    },

    async updateConversa(id: string, userId: string, data: Record<string, unknown>) {
        const [c] = await db.update(conversas)
            .set({ ...data, updated_at: new Date() } as typeof conversas.$inferInsert)
            .where(and(eq(conversas.id, id), eq(conversas.user_id, userId)))
            .returning();
        return c ?? null;
    },

    // ── MENSAGENS ──────────────────────────────────
    async saveMensagem(data: {
        user_id: string;
        conversa_id: string;
        telefone: string;
        direcao: string;
        conteudo: string;
        tipo?: string;
        wam_id?: string;
    }) {
        const [msg] = await db.insert(mensagens).values({
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

    async listMensagens(conversaId: string, userId: string, limit = 100, offset = 0) {
        return db.select().from(mensagens)
            .where(and(eq(mensagens.conversa_id, conversaId), eq(mensagens.user_id, userId)))
            .orderBy(mensagens.created_at)
            .limit(limit)
            .offset(offset);
    },

    async existsMensagemByWamId(wamId: string): Promise<boolean> {
        const result = await db.select({ id: mensagens.id })
            .from(mensagens)
            .where(eq(mensagens.wam_id, wamId))
            .limit(1);
        return result.length > 0;
    },

    // ── DISPAROS ──────────────────────────────────
    async createDisparo(userId: string, data: Record<string, unknown>) {
        const [d] = await db.insert(disparos)
            .values({ ...data, user_id: userId } as typeof disparos.$inferInsert)
            .returning();
        return d;
    },

    async updateDisparo(id: string, userId: string, data: Record<string, unknown>) {
        const [d] = await db.update(disparos)
            .set({ ...data, updated_at: new Date() } as typeof disparos.$inferInsert)
            .where(and(eq(disparos.id, id), eq(disparos.user_id, userId)))
            .returning();
        return d ?? null;
    },

    async findDisparoById(id: string, userId: string) {
        const result = await db.select().from(disparos)
            .where(and(eq(disparos.id, id), eq(disparos.user_id, userId)));
        return result[0] ?? null;
    },

    async listDisparos(userId: string, limit = 50, offset = 0) {
        return db.select().from(disparos)
            .where(eq(disparos.user_id, userId))
            .orderBy(desc(disparos.created_at))
            .limit(limit)
            .offset(offset);
    },

    // ── DISPARO LOGS ──────────────────────────────
    async saveDisparoLog(data: {
        user_id: string;
        lead_id?: string;
        lead_name?: string;
        phone: string;
        success: boolean;
        message_preview?: string;
    }) {
        const [log] = await db.insert(disparoLogs).values(data).returning();
        return log;
    },

    async listDisparoLogs(userId: string, limit = 100, offset = 0) {
        return db.select().from(disparoLogs)
            .where(eq(disparoLogs.user_id, userId))
            .orderBy(desc(disparoLogs.sent_at))
            .limit(limit)
            .offset(offset);
    },

    // ── LIMITE DIÁRIO ──────────────────────────────
    async getLimiteDiario(userId: string): Promise<{ usado: number; limite: number; restante: number }> {
        const hoje = new Date().toISOString().split('T')[0];
        const result = await db.select().from(disparosDiarios)
            .where(and(eq(disparosDiarios.user_id, userId), eq(disparosDiarios.data, hoje)));
        const usado = result[0]?.quantidade ?? 0;
        return { usado, limite: 20, restante: Math.max(0, 20 - usado) };
    },

    async incrementarLimiteDiario(userId: string, quantidade: number) {
        const hoje = new Date().toISOString().split('T')[0];
        const existing = await db.select().from(disparosDiarios)
            .where(and(eq(disparosDiarios.user_id, userId), eq(disparosDiarios.data, hoje)));
        if (existing[0]) {
            await db.update(disparosDiarios)
                .set({ quantidade: (existing[0].quantidade ?? 0) + quantidade })
                .where(eq(disparosDiarios.id, existing[0].id));
        } else {
            await db.insert(disparosDiarios).values({ user_id: userId, data: hoje, quantidade });
        }
    },

    // ── FUNIS DE DISPARO ──────────────────────────
    async listFunis(userId: string) {
        const list = await db.select().from(funis)
            .where(eq(funis.user_id, userId))
            .orderBy(desc(funis.created_at));
        return Promise.all(list.map(async (f) => {
            const etapas = await db.select().from(funilEtapas)
                .where(eq(funilEtapas.funil_id, f.id))
                .orderBy(funilEtapas.ordem);
            return { ...f, etapas };
        }));
    },

    async findFunilById(id: string, userId: string) {
        const result = await db.select().from(funis)
            .where(and(eq(funis.id, id), eq(funis.user_id, userId)));
        if (!result[0]) return null;
        const etapas = await db.select().from(funilEtapas)
            .where(eq(funilEtapas.funil_id, id))
            .orderBy(funilEtapas.ordem);
        return { ...result[0], etapas };
    },

    async createFunil(userId: string, data: {
        nome: string;
        descricao?: string;
        etapas: Array<{ tipo: string; conteudo: string; ordem: number; intervalo_antes: number }>;
    }) {
        const [funil] = await db.insert(funis)
            .values({ nome: data.nome, descricao: data.descricao, user_id: userId })
            .returning();
        const etapas = data.etapas.length
            ? await db.insert(funilEtapas)
                .values(data.etapas.map(e => ({ ...e, funil_id: funil.id })))
                .returning()
            : [];
        return { ...funil, etapas };
    },

    async updateFunil(id: string, userId: string, data: {
        nome: string;
        descricao?: string;
        etapas: Array<{ tipo: string; conteudo: string; ordem: number; intervalo_antes: number }>;
    }) {
        const [updated] = await db.update(funis)
            .set({ nome: data.nome, descricao: data.descricao, updated_at: new Date() })
            .where(and(eq(funis.id, id), eq(funis.user_id, userId)))
            .returning();
        if (!updated) return null;
        await db.delete(funilEtapas).where(eq(funilEtapas.funil_id, id));
        const etapas = data.etapas.length
            ? await db.insert(funilEtapas)
                .values(data.etapas.map(e => ({ ...e, funil_id: id })))
                .returning()
            : [];
        return { ...updated, etapas };
    },

    async deleteFunil(id: string, userId: string) {
        const [deleted] = await db.delete(funis)
            .where(and(eq(funis.id, id), eq(funis.user_id, userId)))
            .returning();
        return deleted ?? null;
    },

    async listEtapasByFunilId(funilId: string) {
        return db.select().from(funilEtapas)
            .where(eq(funilEtapas.funil_id, funilId))
            .orderBy(funilEtapas.ordem);
    },

    // ── AUTOMATION FLOWS ──────────────────────────
    async listFlows(userId: string) {
        return db.select().from(automationFlows)
            .where(eq(automationFlows.user_id, userId))
            .orderBy(desc(automationFlows.created_at));
    },

    async findFlowById(id: string, userId: string) {
        const result = await db.select().from(automationFlows)
            .where(and(eq(automationFlows.id, id), eq(automationFlows.user_id, userId)));
        return result[0] ?? null;
    },

    async createFlow(userId: string, data: Record<string, unknown>) {
        const [flow] = await db.insert(automationFlows)
            .values({ ...data, user_id: userId } as typeof automationFlows.$inferInsert)
            .returning();
        return flow;
    },

    async updateFlow(id: string, userId: string, data: Record<string, unknown>) {
        const [flow] = await db.update(automationFlows)
            .set({ ...data, updated_at: new Date() } as typeof automationFlows.$inferInsert)
            .where(and(eq(automationFlows.id, id), eq(automationFlows.user_id, userId)))
            .returning();
        return flow ?? null;
    },

    async deleteFlow(id: string, userId: string) {
        const [flow] = await db.delete(automationFlows)
            .where(and(eq(automationFlows.id, id), eq(automationFlows.user_id, userId)))
            .returning();
        return flow ?? null;
    },

    // ── AUTOMATION NODES ──────────────────────────
    async listNodes(flowId: string) {
        return db.select().from(automationNodes)
            .where(eq(automationNodes.flow_id, flowId))
            .orderBy(automationNodes.order_index);
    },

    async createNode(data: Record<string, unknown>) {
        const [node] = await db.insert(automationNodes)
            .values(data as typeof automationNodes.$inferInsert)
            .returning();
        return node;
    },

    async updateNode(id: string, data: Record<string, unknown>) {
        const [node] = await db.update(automationNodes)
            .set(data as typeof automationNodes.$inferInsert)
            .where(eq(automationNodes.id, id))
            .returning();
        return node ?? null;
    },

    async deleteNode(id: string) {
        const [node] = await db.delete(automationNodes)
            .where(eq(automationNodes.id, id))
            .returning();
        return node ?? null;
    },

    // ── AUTOMATION SESSIONS ───────────────────────
    async findSession(instanceName: string, phone: string) {
        const result = await db.select().from(automationSessions)
            .where(and(
                eq(automationSessions.instance_name, instanceName),
                eq(automationSessions.phone, phone),
                eq(automationSessions.status, 'active')
            ));
        return result[0] ?? null;
    },

    async createSession(data: Record<string, unknown>) {
        const [session] = await db.insert(automationSessions)
            .values(data as typeof automationSessions.$inferInsert)
            .returning();
        return session;
    },

    async updateSession(id: string, data: Record<string, unknown>) {
        const [session] = await db.update(automationSessions)
            .set({ ...data, updated_at: new Date() } as typeof automationSessions.$inferInsert)
            .where(eq(automationSessions.id, id))
            .returning();
        return session ?? null;
    },
    // ── AUTOMAÇÕES (legado — compatibilidade) ─────
    async listAutomacoes(userId: string) {
        return this.listFlows(userId);
    },

    async createAutomacao(userId: string, data: Record<string, unknown>) {
        const instanceName = `inst-${userId.split('-')[0]}`;
        return this.createFlow(userId, {
            name: data.nome ?? 'Nova automação',
            status: 'rascunho',
            trigger_type: data.trigger ?? 'always',
            instance_name: instanceName,
        });
    },

    async updateAutomacao(id: string, userId: string, data: Record<string, unknown>) {
        return this.updateFlow(id, userId, {
            name: data.nome,
            trigger_type: data.trigger,
        });
    },

    async deleteAutomacao(id: string, userId: string) {
        return this.deleteFlow(id, userId);
    },

    // ── FLOW ENGINE — métodos de suporte ──────────────────────────────────────

    // Descobre o user_id pelo instance_name
    // Ordem: flows → padrão inst-{prefixo} → scan ia_config ativo
    async findUserByInstanceName(instanceName: string) {
        // 1. Tenta por flows (compatibilidade com automações)
        const fromFlow = await db
            .select({ user_id: automationFlows.user_id })
            .from(automationFlows)
            .where(eq(automationFlows.instance_name, instanceName))
            .limit(1);
        if (fromFlow[0]) return fromFlow[0];

        // 2. Padrão SaaS: inst-{primeiros 8 chars do userId}
        //    ex: inst-dd28655c → userId começa com dd28655c
        if (instanceName.startsWith('inst-')) {
            const prefix = instanceName.slice(5); // remove "inst-"
            const fromUser = await db
                .select({ user_id: users.id })
                .from(users)
                .where(sql`${users.id}::text LIKE ${prefix + '%'}`)
                .limit(1);
            if (fromUser[0]) return { user_id: fromUser[0].user_id };
        }

        // 3. Fallback: qualquer ia_config ativo que inclua essa instância
        const configs = await db
            .select({ user_id: iaConfig.user_id, instancias: iaConfig.instancias })
            .from(iaConfig)
            .where(eq(iaConfig.ativo, true));

        for (const cfg of configs) {
            const lista = (cfg.instancias as string[]) ?? [];
            if (lista.length === 0 || lista.includes(instanceName)) {
                return { user_id: cfg.user_id };
            }
        }

        return null;
    },

    // Retorna todos os flows ativos de uma instância
    async findActiveFlowsByInstance(instanceName: string) {
        return db.select().from(automationFlows)
            .where(and(
                eq(automationFlows.instance_name, instanceName),
                eq(automationFlows.status, 'ativo'),
            ));
    },

    // Busca um nó pelo ID
    async findNodeById(nodeId: string) {
        const result = await db.select().from(automationNodes)
            .where(eq(automationNodes.id, nodeId));
        return result[0] ?? null;
    },

    // Retorna o nó de início (type = 'start') de um flow
    async findStartNode(flowId: string) {
        const result = await db.select().from(automationNodes)
            .where(and(
                eq(automationNodes.flow_id, flowId),
                eq(automationNodes.type, 'start'),
            ))
            .orderBy(automationNodes.order_index)
            .limit(1);
        return result[0] ?? null;
    },

    // Conta sessões finalizadas para checar trigger 'primeira_mensagem'
    async countFinishedSessions(instanceName: string, phone: string): Promise<number> {
        const result = await db.select({ total: count() }).from(automationSessions)
            .where(and(
                eq(automationSessions.instance_name, instanceName),
                eq(automationSessions.phone, phone),
                eq(automationSessions.status, 'finished'),
            ));
        return result[0]?.total ?? 0;
    },

    // Retorna as variáveis de uma sessão (respostas coletadas)
    async getSessionVariables(sessionId: string): Promise<Record<string, string>> {
        const result = await db.select({ variables: automationSessions.variables })
            .from(automationSessions)
            .where(eq(automationSessions.id, sessionId));
        return (result[0]?.variables as Record<string, string>) ?? {};
    },

    // Atualiza conversa diretamente pelo ID (sem exigir user_id no where)
    async updateConversaById(id: string, userId: string, data: Record<string, unknown>) {
        const [c] = await db.update(conversas)
            .set({ ...data, updated_at: new Date() } as typeof conversas.$inferInsert)
            .where(and(eq(conversas.id, id), eq(conversas.user_id, userId)))
            .returning();
        return c ?? null;
    },

    // ── IA CONFIG ─────────────────────────────────────
    async getIaConfigByUserId(userId: string) {
        const result = await db.select().from(iaConfig)
            .where(eq(iaConfig.user_id, userId));
        return result[0] ?? null;
    },

    async getIaConfigByInstanceName(instanceName: string) {
        const result = await db.select().from(iaConfig)
            .where(eq(iaConfig.instance_name, instanceName));
        return result[0] ?? null;
    },

    async upsertIaConfig(userId: string, instanceName: string, data: Partial<{
        ativo: boolean;
        instancias: string[];
        openai_api_key: string | null;
        modelo: string;
        max_tokens: number;
        temperatura: number;
        prompt_sistema: string | null;
        regras: Array<{ palavra_chave: string; novo_status: string; pausar_ia: boolean }>;
    }>) {
        const existing = await db.select({ id: iaConfig.id }).from(iaConfig)
            .where(eq(iaConfig.user_id, userId));

        if (existing[0]) {
            const [updated] = await db.update(iaConfig)
                .set({ ...data, instance_name: instanceName, updated_at: new Date() } as typeof iaConfig.$inferInsert)
                .where(eq(iaConfig.user_id, userId))
                .returning();
            return updated;
        }

        const [created] = await db.insert(iaConfig)
            .values({ ...data, user_id: userId, instance_name: instanceName } as typeof iaConfig.$inferInsert)
            .returning();
        return created;
    },
















};