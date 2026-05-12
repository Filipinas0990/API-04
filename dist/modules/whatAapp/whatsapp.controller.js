"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappController = void 0;
const zod_1 = require("zod");
const whatsapp_repository_1 = require("./whatsapp.repository");
const evolution_service_1 = require("./evolution.service");
const assistente_service_1 = require("./assistente.service");
const flow_engine_1 = require("./flow.engine");
const env_1 = require("../../config/env");
const visita_repository_1 = require("../visitas/visita.repository");
const tarefa_repository_1 = require("../tarefas/tarefa.repository");
const lead_repository_1 = require("../leads/lead.repository");
const venda_repository_1 = require("../vendas/venda.repository");
const imovel_repository_1 = require("../imoveis/imovel.repository");
const sendSchema = zod_1.z.object({
    telefone: zod_1.z.string().min(10),
    mensagem: zod_1.z.string().min(1),
});
const disparoSchema = zod_1.z.object({
    leads_ids: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(20),
    mensagem: zod_1.z.string().min(1),
    template: zod_1.z.string().optional(),
});
const automacaoSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1),
    ativo: zod_1.z.boolean().default(false),
    trigger: zod_1.z.string().default('sempre'),
    palavra_chave: zod_1.z.string().optional(),
    nos: zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.unknown())).default([]),
});
exports.whatsappController = {
    // ── STATUS ──────────────────────────────────
    async getStatus(_req, reply) {
        const status = await evolution_service_1.evolutionService.getStatus();
        return reply.send(status);
    },
    // ── CONVERSAS ──────────────────────────────────
    async listConversas(req, reply) {
        const { status, limit, offset } = req.query;
        const lista = await whatsapp_repository_1.whatsappRepository.listConversas(req.user.id, status, limit ? parseInt(limit, 10) : undefined, offset ? parseInt(offset, 10) : undefined);
        return reply.send(lista);
    },
    async updateConversa(req, reply) {
        const { id } = req.params;
        const data = req.body;
        const conversa = await whatsapp_repository_1.whatsappRepository.updateConversa(id, req.user.id, data);
        if (!conversa)
            return reply.status(404).send({ message: 'Conversa não encontrada' });
        return reply.send(conversa);
    },
    // ── MENSAGENS ──────────────────────────────────
    async listMensagens(req, reply) {
        const { conversaId } = req.params;
        const { limit, offset } = req.query;
        const msgs = await whatsapp_repository_1.whatsappRepository.listMensagens(conversaId, req.user.id, limit ? parseInt(limit, 10) : undefined, offset ? parseInt(offset, 10) : undefined);
        return reply.send(msgs);
    },
    async sendMensagem(req, reply) {
        const { telefone, mensagem } = sendSchema.parse(req.body);
        const conversa = await whatsapp_repository_1.whatsappRepository.findOrCreateConversa(req.user.id, telefone);
        const ok = await evolution_service_1.evolutionService.sendText(telefone, mensagem);
        await whatsapp_repository_1.whatsappRepository.saveMensagem({
            user_id: req.user.id,
            conversa_id: conversa.id,
            telefone,
            direcao: 'enviada',
            conteudo: mensagem,
        });
        await whatsapp_repository_1.whatsappRepository.updateConversa(conversa.id, req.user.id, {
            ultima_msg: mensagem,
            ultima_msg_em: new Date(),
        });
        return reply.send({ ok, conversa_id: conversa.id });
    },
    // ── WEBHOOK ──────────────────────────────────
    async webhook(req, reply) {
        // Valida token secreto se configurado
        if (env_1.env.WEBHOOK_SECRET) {
            const token = req.query.token
                ?? req.headers['x-webhook-token'];
            if (token !== env_1.env.WEBHOOK_SECRET) {
                return reply.status(401).send({ message: 'Não autorizado' });
            }
        }
        const body = req.body;
        const event = body?.event;
        if (event !== 'messages.upsert')
            return reply.send({ ok: true });
        const data = body?.data;
        const key = data?.key;
        if (key?.fromMe)
            return reply.send({ ok: true });
        const telefone = key?.remoteJid?.replace('@s.whatsapp.net', '');
        const msgContent = data?.message;
        const conteudo = (msgContent?.conversation ?? msgContent?.extendedTextMessage
            ? (msgContent?.extendedTextMessage?.text ?? msgContent?.conversation)
            : '[mídia]');
        const instanceName = body?.instance;
        if (!telefone || !instanceName)
            return reply.send({ ok: true });
        // Responde imediatamente à Evolution API e processa em background
        reply.send({ ok: true });
        // ── Verifica se é resposta a lembrete de visita ──────────────────────
        (async () => {
            try {
                const visita = await visita_repository_1.visitaRepository.findPendingLembreteByPhone(telefone);
                if (visita) {
                    const resp = conteudo.trim().toLowerCase();
                    const confirmou = ['1', 'sim', 's', 'confirmo', 'yes'].includes(resp);
                    const recusou = ['2', 'não', 'nao', 'n', 'não posso', 'nao posso'].includes(resp);
                    if (confirmou) {
                        await visita_repository_1.visitaRepository.marcarConfirmada(visita.id, true);
                        await evolution_service_1.evolutionService.sendText(telefone, '✅ Perfeito! Visita confirmada. Te esperamos lá! 🏡');
                    }
                    else if (recusou) {
                        await visita_repository_1.visitaRepository.marcarConfirmada(visita.id, false);
                        await evolution_service_1.evolutionService.sendText(telefone, 'Tudo bem! Um de nossos corretores vai entrar em contato. 😊');
                        const nome = visita.nome_cliente ?? telefone;
                        const dataFormatada = new Date(visita.data).toLocaleString('pt-BR', {
                            timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short',
                        });
                        await tarefa_repository_1.tarefaRepository.create(visita.user_id, {
                            titulo: `${nome} cancelou a visita`,
                            descricao: `Cliente informou que não poderá comparecer à visita de ${dataFormatada}.`,
                            data_fim: new Date(),
                            prioridade: 'alta',
                            lead_id: visita.lead_id ?? null,
                        });
                        await visita_repository_1.visitaRepository.marcarTarefaLembreteCriada(visita.id);
                    }
                    else {
                        // Resposta não reconhecida — re-prompt sem cair no fluxo de automação
                        await evolution_service_1.evolutionService.sendText(telefone, 'Não entendi sua resposta. 😊\nPor favor, responda:\n*1 - Sim, confirmo ✅*\n*2 - Não poderei ir ❌*');
                    }
                    return; // não processa como flow normal
                }
            }
            catch (err) {
                console.error('[webhook] Erro ao processar lembrete de visita:', err);
            }
            // ── Processa flow de automação normalmente ───────────────────────
            flow_engine_1.flowEngine.processIncomingMessage(instanceName, telefone, conteudo).catch(console.error);
        })();
    },
    // ── ASSISTENTE IA ──────────────────────────────────
    async assistente(req, reply) {
        const { mensagem } = req.body;
        if (!mensagem)
            return reply.status(400).send({ message: 'Mensagem é obrigatória' });
        const intencao = await assistente_service_1.assistenteService.processar(mensagem);
        if (intencao.acao === 'registrar_lead') {
            const dados = intencao.dados;
            if (dados.name && dados.telefone) {
                const lead = await lead_repository_1.leadRepository.create(req.user.id, {
                    name: dados.name, telefone: dados.telefone,
                    interesse: dados.interesse, temperatura: dados.temperatura ?? 1,
                });
                return reply.send({ acao: 'registrar_lead', resultado: lead, resposta: intencao.resposta });
            }
        }
        if (intencao.acao === 'registrar_venda') {
            const dados = intencao.dados;
            if (dados.valor) {
                const venda = await venda_repository_1.vendaRepository.create(req.user.id, {
                    valor: dados.valor, status: dados.status ?? 'Em negociação', observacoes: dados.observacoes,
                });
                return reply.send({ acao: 'registrar_venda', resultado: venda, resposta: intencao.resposta });
            }
        }
        if (intencao.acao === 'registrar_imovel') {
            const dados = intencao.dados;
            if (dados.titulo) {
                const imovel = await imovel_repository_1.imovelRepository.create(req.user.id, {
                    titulo: dados.titulo, tipo: dados.tipo, preco: dados.preco, cidade: dados.cidade,
                });
                return reply.send({ acao: 'registrar_imovel', resultado: imovel, resposta: intencao.resposta });
            }
        }
        return reply.send({ acao: intencao.acao, resposta: intencao.resposta });
    },
    // ── DISPAROS ──────────────────────────────────
    async getLimiteDiario(req, reply) {
        const limite = await whatsapp_repository_1.whatsappRepository.getLimiteDiario(req.user.id);
        return reply.send(limite);
    },
    async listDisparos(req, reply) {
        const { limit, offset } = req.query;
        const lista = await whatsapp_repository_1.whatsappRepository.listDisparos(req.user.id, limit ? parseInt(limit, 10) : undefined, offset ? parseInt(offset, 10) : undefined);
        return reply.send(lista);
    },
    async listDisparoLogs(req, reply) {
        const { limit, offset } = req.query;
        const logs = await whatsapp_repository_1.whatsappRepository.listDisparoLogs(req.user.id, limit ? parseInt(limit, 10) : undefined, offset ? parseInt(offset, 10) : undefined);
        return reply.send(logs);
    },
    async iniciarDisparo(req, reply) {
        const { leads_ids, mensagem, template } = disparoSchema.parse(req.body);
        const limite = await whatsapp_repository_1.whatsappRepository.getLimiteDiario(req.user.id);
        if (leads_ids.length > limite.restante) {
            return reply.status(429).send({
                statusCode: 429, error: 'Limite excedido',
                message: `Você só tem ${limite.restante} disparos disponíveis hoje`,
            });
        }
        const disparo = await whatsapp_repository_1.whatsappRepository.createDisparo(req.user.id, {
            mensagem, template, total: leads_ids.length, leads_ids, status: 'em_andamento',
        });
        let enviados = 0;
        let falhas = 0;
        for (const leadId of leads_ids) {
            try {
                const lead = await lead_repository_1.leadRepository.findById(leadId, req.user.id);
                if (!lead?.telefone) {
                    falhas++;
                    continue;
                }
                const msgFinal = mensagem
                    .replace('{nome}', lead.name)
                    .replace('{interesse}', lead.interesse ?? '');
                const ok = await evolution_service_1.evolutionService.sendText(lead.telefone, msgFinal);
                if (ok) {
                    enviados++;
                    const conversa = await whatsapp_repository_1.whatsappRepository.findOrCreateConversa(req.user.id, lead.telefone, lead.name);
                    await whatsapp_repository_1.whatsappRepository.saveMensagem({
                        user_id: req.user.id, conversa_id: conversa.id,
                        telefone: lead.telefone, direcao: 'enviada', conteudo: msgFinal,
                    });
                    await whatsapp_repository_1.whatsappRepository.saveDisparoLog({
                        user_id: req.user.id, lead_id: lead.id, lead_name: lead.name,
                        phone: lead.telefone, success: true, message_preview: msgFinal.slice(0, 100),
                    });
                }
                else {
                    falhas++;
                    await whatsapp_repository_1.whatsappRepository.saveDisparoLog({
                        user_id: req.user.id, lead_id: lead.id, lead_name: lead.name,
                        phone: lead.telefone, success: false, message_preview: msgFinal.slice(0, 100),
                    });
                }
                await new Promise(r => setTimeout(r, 1500));
            }
            catch {
                falhas++;
            }
        }
        await whatsapp_repository_1.whatsappRepository.incrementarLimiteDiario(req.user.id, enviados);
        const resultado = await whatsapp_repository_1.whatsappRepository.updateDisparo(disparo.id, req.user.id, {
            enviados, falhas, status: 'concluido',
        });
        return reply.send(resultado);
    },
    // ── AUTOMAÇÕES (legado) ───────────────────────
    async listAutomacoes(req, reply) {
        const lista = await whatsapp_repository_1.whatsappRepository.listAutomacoes(req.user.id);
        return reply.send(lista);
    },
    async createAutomacao(req, reply) {
        const data = automacaoSchema.parse(req.body);
        const automacao = await whatsapp_repository_1.whatsappRepository.createAutomacao(req.user.id, data);
        return reply.status(201).send(automacao);
    },
    async updateAutomacao(req, reply) {
        const { id } = req.params;
        const data = automacaoSchema.partial().parse(req.body);
        const automacao = await whatsapp_repository_1.whatsappRepository.updateAutomacao(id, req.user.id, data);
        if (!automacao)
            return reply.status(404).send({ message: 'Automação não encontrada' });
        return reply.send(automacao);
    },
    async deleteAutomacao(req, reply) {
        const { id } = req.params;
        const automacao = await whatsapp_repository_1.whatsappRepository.deleteAutomacao(id, req.user.id);
        if (!automacao)
            return reply.status(404).send({ message: 'Automação não encontrada' });
        return reply.status(204).send();
    },
    // ── AUTOMATION FLOWS ──────────────────────────
    async listFlows(req, reply) {
        const flows = await whatsapp_repository_1.whatsappRepository.listFlows(req.user.id);
        return reply.send(flows);
    },
    async getFlowById(req, reply) {
        const { id } = req.params;
        const flow = await whatsapp_repository_1.whatsappRepository.findFlowById(id, req.user.id);
        if (!flow)
            return reply.status(404).send({ message: 'Flow não encontrado' });
        const nodes = await whatsapp_repository_1.whatsappRepository.listNodes(id);
        return reply.send({ ...flow, nodes });
    },
    async createFlow(req, reply) {
        const data = req.body;
        const instanceName = `inst-${req.user.id.split('-')[0]}`;
        const flow = await whatsapp_repository_1.whatsappRepository.createFlow(req.user.id, { ...data, instance_name: instanceName });
        return reply.status(201).send(flow);
    },
    async updateFlow(req, reply) {
        const { id } = req.params;
        const data = req.body;
        const flow = await whatsapp_repository_1.whatsappRepository.updateFlow(id, req.user.id, data);
        if (!flow)
            return reply.status(404).send({ message: 'Flow não encontrado' });
        return reply.send(flow);
    },
    async deleteFlow(req, reply) {
        const { id } = req.params;
        const flow = await whatsapp_repository_1.whatsappRepository.deleteFlow(id, req.user.id);
        if (!flow)
            return reply.status(404).send({ message: 'Flow não encontrado' });
        return reply.status(204).send();
    },
    // ── AUTOMATION NODES ──────────────────────────
    async listNodes(req, reply) {
        const { flowId } = req.params;
        const nodes = await whatsapp_repository_1.whatsappRepository.listNodes(flowId);
        return reply.send(nodes);
    },
    async createNode(req, reply) {
        const { flowId } = req.params;
        const data = req.body;
        const node = await whatsapp_repository_1.whatsappRepository.createNode({ ...data, flow_id: flowId });
        return reply.status(201).send(node);
    },
    async updateNode(req, reply) {
        const { id } = req.params;
        const data = req.body;
        const node = await whatsapp_repository_1.whatsappRepository.updateNode(id, data);
        if (!node)
            return reply.status(404).send({ message: 'Node não encontrado' });
        return reply.send(node);
    },
    async deleteNode(req, reply) {
        const { id } = req.params;
        const node = await whatsapp_repository_1.whatsappRepository.deleteNode(id);
        if (!node)
            return reply.status(404).send({ message: 'Node não encontrado' });
        return reply.status(204).send();
    },
    // ── EVOLUTION PROXY ───────────────────────────────────────────────────────
    // Repassa chamadas para a Evolution API bloqueando endpoints destrutivos
    async evolutionProxy(req, reply) {
        const wildcard = req.params['*'] ?? '';
        const BLOCKED = ['instance/logout', 'instance/delete', 'instance/restart', 'instance/create'];
        if (BLOCKED.some(path => wildcard.toLowerCase().startsWith(path))) {
            return reply.status(403).send({ message: 'Endpoint bloqueado por segurança' });
        }
        const qs = new URLSearchParams(req.query).toString();
        const targetUrl = `${env_1.env.EVOLUTION_API_URL}/${wildcard}${qs ? `?${qs}` : ''}`;
        const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && req.body != null;
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': env_1.env.EVOLUTION_API_KEY,
            },
            body: hasBody ? JSON.stringify(req.body) : undefined,
        });
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
            const data = await response.json();
            return reply.status(response.status).send(data);
        }
        const text = await response.text();
        return reply.status(response.status).send(text);
    },
};
//# sourceMappingURL=whatsapp.controller.js.map