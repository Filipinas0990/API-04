import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { whatsappRepository } from './whatsapp.repository';
import { evolutionService } from './evolution.service';
import { assistenteService } from './assistente.service';
import { flowEngine } from './flow.engine';
import { env } from '../../config/env';
import { visitaRepository } from '../visitas/visita.repository';
import { tarefaRepository } from '../tarefas/tarefa.repository';
import { leadRepository } from '../leads/lead.repository';
import { vendaRepository } from '../vendas/venda.repository';
import { imovelRepository } from '../imoveis/imovel.repository';

const sendSchema = z.object({
    telefone: z.string().min(10),
    mensagem: z.string().min(1),
});

const disparoSchema = z.object({
    leads_ids: z.array(z.string().uuid()).min(1).max(20),
    mensagem: z.string().min(1),
    template: z.string().optional(),
});

const automacaoSchema = z.object({
    nome: z.string().min(1),
    ativo: z.boolean().default(false),
    trigger: z.string().default('sempre'),
    palavra_chave: z.string().optional(),
    nos: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const whatsappController = {
    // ── STATUS ──────────────────────────────────
    async getStatus(_req: FastifyRequest, reply: FastifyReply) {
        const status = await evolutionService.getStatus();
        return reply.send(status);
    },

    // ── CONVERSAS ──────────────────────────────────
    async listConversas(req: FastifyRequest, reply: FastifyReply) {
        const { status, limit, offset } = req.query as { status?: string; limit?: string; offset?: string };
        const lista = await whatsappRepository.listConversas(
            req.user.id, status,
            limit ? parseInt(limit, 10) : undefined,
            offset ? parseInt(offset, 10) : undefined,
        );
        return reply.send(lista);
    },

    async updateConversa(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = req.body as Record<string, unknown>;
        const conversa = await whatsappRepository.updateConversa(id, req.user.id, data);
        if (!conversa) return reply.status(404).send({ message: 'Conversa não encontrada' });
        return reply.send(conversa);
    },

    // ── MENSAGENS ──────────────────────────────────
    async listMensagens(req: FastifyRequest, reply: FastifyReply) {
        const { conversaId } = req.params as { conversaId: string };
        const { limit, offset } = req.query as { limit?: string; offset?: string };
        const msgs = await whatsappRepository.listMensagens(
            conversaId, req.user.id,
            limit ? parseInt(limit, 10) : undefined,
            offset ? parseInt(offset, 10) : undefined,
        );
        return reply.send(msgs);
    },

    async sendMensagem(req: FastifyRequest, reply: FastifyReply) {
        const { telefone, mensagem } = sendSchema.parse(req.body);
        const conversa = await whatsappRepository.findOrCreateConversa(req.user.id, telefone);
        const ok = await evolutionService.sendText(telefone, mensagem);
        await whatsappRepository.saveMensagem({
            user_id: req.user.id,
            conversa_id: conversa.id,
            telefone,
            direcao: 'enviada',
            conteudo: mensagem,
        });
        await whatsappRepository.updateConversa(conversa.id, req.user.id, {
            ultima_msg: mensagem,
            ultima_msg_em: new Date(),
        });
        return reply.send({ ok, conversa_id: conversa.id });
    },

    // ── WEBHOOK ──────────────────────────────────
    async webhook(req: FastifyRequest, reply: FastifyReply) {
        // Valida token secreto se configurado
        if (env.WEBHOOK_SECRET) {
            const token = (req.query as Record<string, string>).token
                ?? req.headers['x-webhook-token'];
            if (token !== env.WEBHOOK_SECRET) {
                return reply.status(401).send({ message: 'Não autorizado' });
            }
        }

        const body = req.body as Record<string, unknown>;
        const event = body?.event as string;
        if (event !== 'messages.upsert') return reply.send({ ok: true });

        const data = body?.data as Record<string, unknown>;
        const key = data?.key as Record<string, unknown>;
        if (key?.fromMe) return reply.send({ ok: true });

        const telefone = (key?.remoteJid as string)?.replace('@s.whatsapp.net', '');
        const msgContent = data?.message as Record<string, unknown> | undefined;
        const conteudo = (msgContent?.conversation ?? msgContent?.extendedTextMessage
            ? ((msgContent?.extendedTextMessage as Record<string, unknown>)?.text ?? msgContent?.conversation)
            : '[mídia]') as string;
        const instanceName = body?.instance as string;

        if (!telefone || !instanceName) return reply.send({ ok: true });

        // Responde imediatamente à Evolution API e processa em background
        reply.send({ ok: true });

        // ── Verifica se é resposta a lembrete de visita ──────────────────────
        (async () => {
            try {
                const visita = await visitaRepository.findPendingLembreteByPhone(telefone);
                if (visita) {
                    const resp = conteudo.trim().toLowerCase();
                    const confirmou = ['1', 'sim', 's', 'confirmo', 'yes'].includes(resp);
                    const recusou = ['2', 'não', 'nao', 'n', 'não posso', 'nao posso'].includes(resp);

                    if (confirmou) {
                        await visitaRepository.marcarConfirmada(visita.id, true);
                        await evolutionService.sendText(telefone, '✅ Perfeito! Visita confirmada. Te esperamos lá! 🏡');
                    } else if (recusou) {
                        await visitaRepository.marcarConfirmada(visita.id, false);
                        await evolutionService.sendText(telefone, 'Tudo bem! Um de nossos corretores vai entrar em contato. 😊');
                        const nome = visita.nome_cliente ?? telefone;
                        const dataFormatada = new Date(visita.data).toLocaleString('pt-BR', {
                            timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short',
                        });
                        await tarefaRepository.create(visita.user_id, {
                            titulo: `${nome} cancelou a visita`,
                            descricao: `Cliente informou que não poderá comparecer à visita de ${dataFormatada}.`,
                            data_fim: new Date(),
                            prioridade: 'alta',
                            lead_id: visita.lead_id ?? null,
                        });
                        await visitaRepository.marcarTarefaLembreteCriada(visita.id);
                    } else {
                        // Resposta não reconhecida — re-prompt sem cair no fluxo de automação
                        await evolutionService.sendText(telefone,
                            'Não entendi sua resposta. 😊\nPor favor, responda:\n*1 - Sim, confirmo ✅*\n*2 - Não poderei ir ❌*');
                    }
                    return; // não processa como flow normal
                }
            } catch (err) {
                console.error('[webhook] Erro ao processar lembrete de visita:', err);
            }

            // ── Processa flow de automação normalmente ───────────────────────
            flowEngine.processIncomingMessage(instanceName, telefone, conteudo).catch(console.error);
        })();
    },

    // ── ASSISTENTE IA ──────────────────────────────────
    async assistente(req: FastifyRequest, reply: FastifyReply) {
        const { mensagem } = req.body as { mensagem: string };
        if (!mensagem) return reply.status(400).send({ message: 'Mensagem é obrigatória' });
        const intencao = await assistenteService.processar(mensagem);
        if (intencao.acao === 'registrar_lead') {
            const dados = intencao.dados as { name?: string; telefone?: string; interesse?: string; temperatura?: number };
            if (dados.name && dados.telefone) {
                const lead = await leadRepository.create(req.user.id, {
                    name: dados.name, telefone: dados.telefone,
                    interesse: dados.interesse, temperatura: dados.temperatura ?? 1,
                });
                return reply.send({ acao: 'registrar_lead', resultado: lead, resposta: intencao.resposta });
            }
        }
        if (intencao.acao === 'registrar_venda') {
            const dados = intencao.dados as { valor?: number; status?: string; observacoes?: string };
            if (dados.valor) {
                const venda = await vendaRepository.create(req.user.id, {
                    valor: dados.valor, status: dados.status ?? 'Em negociação', observacoes: dados.observacoes,
                });
                return reply.send({ acao: 'registrar_venda', resultado: venda, resposta: intencao.resposta });
            }
        }
        if (intencao.acao === 'registrar_imovel') {
            const dados = intencao.dados as { titulo?: string; tipo?: string; preco?: number; cidade?: string };
            if (dados.titulo) {
                const imovel = await imovelRepository.create(req.user.id, {
                    titulo: dados.titulo, tipo: dados.tipo, preco: dados.preco, cidade: dados.cidade,
                });
                return reply.send({ acao: 'registrar_imovel', resultado: imovel, resposta: intencao.resposta });
            }
        }
        return reply.send({ acao: intencao.acao, resposta: intencao.resposta });
    },

    // ── DISPAROS ──────────────────────────────────
    async getLimiteDiario(req: FastifyRequest, reply: FastifyReply) {
        const limite = await whatsappRepository.getLimiteDiario(req.user.id);
        return reply.send(limite);
    },

    async listDisparos(req: FastifyRequest, reply: FastifyReply) {
        const { limit, offset } = req.query as { limit?: string; offset?: string };
        const lista = await whatsappRepository.listDisparos(
            req.user.id,
            limit ? parseInt(limit, 10) : undefined,
            offset ? parseInt(offset, 10) : undefined,
        );
        return reply.send(lista);
    },

    async listDisparoLogs(req: FastifyRequest, reply: FastifyReply) {
        const { limit, offset } = req.query as { limit?: string; offset?: string };
        const logs = await whatsappRepository.listDisparoLogs(
            req.user.id,
            limit ? parseInt(limit, 10) : undefined,
            offset ? parseInt(offset, 10) : undefined,
        );
        return reply.send(logs);
    },

    async iniciarDisparo(req: FastifyRequest, reply: FastifyReply) {
        const { leads_ids, mensagem, template } = disparoSchema.parse(req.body);
        const limite = await whatsappRepository.getLimiteDiario(req.user.id);
        if (leads_ids.length > limite.restante) {
            return reply.status(429).send({
                statusCode: 429, error: 'Limite excedido',
                message: `Você só tem ${limite.restante} disparos disponíveis hoje`,
            });
        }
        const disparo = await whatsappRepository.createDisparo(req.user.id, {
            mensagem, template, total: leads_ids.length, leads_ids, status: 'em_andamento',
        });
        let enviados = 0;
        let falhas = 0;
        for (const leadId of leads_ids) {
            try {
                const lead = await leadRepository.findById(leadId, req.user.id);
                if (!lead?.telefone) { falhas++; continue; }
                const msgFinal = mensagem
                    .replace('{nome}', lead.name)
                    .replace('{interesse}', lead.interesse ?? '');
                const ok = await evolutionService.sendText(lead.telefone, msgFinal);
                if (ok) {
                    enviados++;
                    const conversa = await whatsappRepository.findOrCreateConversa(req.user.id, lead.telefone, lead.name);
                    await whatsappRepository.saveMensagem({
                        user_id: req.user.id, conversa_id: conversa.id,
                        telefone: lead.telefone, direcao: 'enviada', conteudo: msgFinal,
                    });
                    await whatsappRepository.saveDisparoLog({
                        user_id: req.user.id, lead_id: lead.id, lead_name: lead.name,
                        phone: lead.telefone, success: true, message_preview: msgFinal.slice(0, 100),
                    });
                } else {
                    falhas++;
                    await whatsappRepository.saveDisparoLog({
                        user_id: req.user.id, lead_id: lead.id, lead_name: lead.name,
                        phone: lead.telefone, success: false, message_preview: msgFinal.slice(0, 100),
                    });
                }
                await new Promise(r => setTimeout(r, 1500));
            } catch { falhas++; }
        }
        await whatsappRepository.incrementarLimiteDiario(req.user.id, enviados);
        const resultado = await whatsappRepository.updateDisparo(disparo.id, req.user.id, {
            enviados, falhas, status: 'concluido',
        });
        return reply.send(resultado);
    },

    // ── AUTOMAÇÕES (legado) ───────────────────────
    async listAutomacoes(req: FastifyRequest, reply: FastifyReply) {
        const lista = await whatsappRepository.listAutomacoes(req.user.id);
        return reply.send(lista);
    },

    async createAutomacao(req: FastifyRequest, reply: FastifyReply) {
        const data = automacaoSchema.parse(req.body);
        const automacao = await whatsappRepository.createAutomacao(req.user.id, data);
        return reply.status(201).send(automacao);
    },

    async updateAutomacao(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = automacaoSchema.partial().parse(req.body);
        const automacao = await whatsappRepository.updateAutomacao(id, req.user.id, data);
        if (!automacao) return reply.status(404).send({ message: 'Automação não encontrada' });
        return reply.send(automacao);
    },

    async deleteAutomacao(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const automacao = await whatsappRepository.deleteAutomacao(id, req.user.id);
        if (!automacao) return reply.status(404).send({ message: 'Automação não encontrada' });
        return reply.status(204).send();
    },

    // ── AUTOMATION FLOWS ──────────────────────────
    async listFlows(req: FastifyRequest, reply: FastifyReply) {
        const flows = await whatsappRepository.listFlows(req.user.id);
        return reply.send(flows);
    },

    async getFlowById(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const flow = await whatsappRepository.findFlowById(id, req.user.id);
        if (!flow) return reply.status(404).send({ message: 'Flow não encontrado' });
        const nodes = await whatsappRepository.listNodes(id);
        return reply.send({ ...flow, nodes });
    },

    async createFlow(req: FastifyRequest, reply: FastifyReply) {
        const data = req.body as Record<string, unknown>;
        const instanceName = `inst-${req.user.id.split('-')[0]}`;
        const flow = await whatsappRepository.createFlow(req.user.id, { ...data, instance_name: instanceName });
        return reply.status(201).send(flow);
    },

    async updateFlow(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = req.body as Record<string, unknown>;
        const flow = await whatsappRepository.updateFlow(id, req.user.id, data);
        if (!flow) return reply.status(404).send({ message: 'Flow não encontrado' });
        return reply.send(flow);
    },

    async deleteFlow(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const flow = await whatsappRepository.deleteFlow(id, req.user.id);
        if (!flow) return reply.status(404).send({ message: 'Flow não encontrado' });
        return reply.status(204).send();
    },

    // ── AUTOMATION NODES ──────────────────────────
    async listNodes(req: FastifyRequest, reply: FastifyReply) {
        const { flowId } = req.params as { flowId: string };
        const nodes = await whatsappRepository.listNodes(flowId);
        return reply.send(nodes);
    },

    async createNode(req: FastifyRequest, reply: FastifyReply) {
        const { flowId } = req.params as { flowId: string };
        const data = req.body as Record<string, unknown>;
        const node = await whatsappRepository.createNode({ ...data, flow_id: flowId });
        return reply.status(201).send(node);
    },

    async updateNode(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = req.body as Record<string, unknown>;
        const node = await whatsappRepository.updateNode(id, data);
        if (!node) return reply.status(404).send({ message: 'Node não encontrado' });
        return reply.send(node);
    },

    async deleteNode(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const node = await whatsappRepository.deleteNode(id);
        if (!node) return reply.status(404).send({ message: 'Node não encontrado' });
        return reply.status(204).send();
    },

    // ── EVOLUTION PROXY ───────────────────────────────────────────────────────
    // Repassa chamadas para a Evolution API bloqueando endpoints destrutivos
    async evolutionProxy(req: FastifyRequest, reply: FastifyReply) {
        const wildcard = (req.params as Record<string, string>)['*'] ?? '';

        const BLOCKED = ['instance/logout', 'instance/delete', 'instance/restart', 'instance/create'];
        if (BLOCKED.some(path => wildcard.toLowerCase().startsWith(path))) {
            return reply.status(403).send({ message: 'Endpoint bloqueado por segurança' });
        }
        const qs = new URLSearchParams(req.query as Record<string, string>).toString();
        const targetUrl = `${env.EVOLUTION_API_URL}/${wildcard}${qs ? `?${qs}` : ''}`;

        const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && req.body != null;

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': env.EVOLUTION_API_KEY,
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