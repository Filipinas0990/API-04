import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { whatsappRepository } from './whatsapp.repository';
import { evolutionService } from './evolution.service';
import { assistenteService } from './assistente.service';
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
        const { status } = req.query as { status?: string };
        const lista = await whatsappRepository.listConversas(req.user.id, status);
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
        const msgs = await whatsappRepository.listMensagens(conversaId, req.user.id);
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
        const body = req.body as Record<string, unknown>;
        const event = body?.event as string;
        if (event !== 'messages.upsert') return reply.send({ ok: true });
        const data = body?.data as Record<string, unknown>;
        const key = data?.key as Record<string, unknown>;
        const fromMe = key?.fromMe as boolean;
        if (fromMe) return reply.send({ ok: true });
        const telefone = (key?.remoteJid as string)?.replace('@s.whatsapp.net', '');
        const conteudo = (data?.message as Record<string, unknown>)?.conversation as string ?? '[mídia]';
        const instanceName = body?.instance as string;
        return reply.send({ ok: true, telefone, conteudo, instanceName });
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
        const lista = await whatsappRepository.listDisparos(req.user.id);
        return reply.send(lista);
    },

    async listDisparoLogs(req: FastifyRequest, reply: FastifyReply) {
        const logs = await whatsappRepository.listDisparoLogs(req.user.id);
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
};