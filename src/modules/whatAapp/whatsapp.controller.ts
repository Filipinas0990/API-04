import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pipeline } from 'stream/promises';
import { createWriteStream, createReadStream } from 'fs';
import { mkdir, access } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { whatsappRepository } from './whatsapp.repository';
import { evolutionService } from './evolution.service';
import { assistenteService } from './assistente.service';
import { enfileirarFilipe } from './filipe.queue';
import { flowEngine } from './flow.engine';
import { campanhaRunner } from './campanha.runner';
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

// Etapas válidas do kanban (= status do lead)
const KANBAN_ETAPAS = [
    'novo_cliente', 'em_contato', 'visita_marcada', 'proposta_enviada', 'cliente_desistiu',
] as const;

const funilSchema = z.object({
    nome: z.string().min(1).max(100),
    descricao: z.string().max(500).optional(),
    etapas: z.array(z.object({
        tipo: z.enum(['texto', 'imagem', 'video', 'audio']),
        conteudo: z.string().default(''),
        ordem: z.number().int().min(0),
        intervalo_antes: z.number().int().min(0).max(3600).default(0),
    })).min(1),
});

const UPLOADS_DIR = '/app/uploads';
const TIPOS_PERMITIDOS = ['image/', 'video/', 'audio/'];

const campanhaSchema = z.object({
    // Origem dos leads: lista direta OU etapa do kanban
    leads_ids: z.array(z.string().uuid()).min(1).max(200).optional(),
    kanban_etapa: z.enum(KANBAN_ETAPAS).optional(),
    mensagem: z.string().min(1),
    funil_id: z.string().uuid().optional(),
    // Intervalo anti-ban: 60s padrão, mínimo 30s, máximo 1h
    intervalo_segundos: z.number().int().min(30).max(3600).default(60),
}).refine(d => d.leads_ids?.length || d.kanban_etapa, {
    message: 'Informe leads_ids ou kanban_etapa',
});

const automacaoSchema = z.object({
    nome: z.string().min(1),
    ativo: z.boolean().default(false),
    trigger: z.string().default('sempre'),
    palavra_chave: z.string().optional(),
    nos: z.array(z.record(z.string(), z.unknown())).default([]),
});

function instanceName(userId: string): string {
    return `inst-${userId.split('-')[0]}`;
}

function normalizarTelefone(tel: string): string {
    const digitos = tel.replace(/\D/g, '');
    if (digitos.startsWith('55') && digitos.length >= 12) {
        return digitos.slice(2);
    }
    return digitos;
}

// ── Rate limiting — exclusivo do Filipe ─────────────────────────────────────
const RATE_LIMIT_MAX = 10;        // máximo de mensagens por janela
const RATE_LIMIT_JANELA_MS = 60_000; // janela de 1 minuto

const filipeRateLimit = new Map<string, number[]>();

function verificarRateLimit(telefone: string): boolean {
    const agora = Date.now();
    const timestamps = (filipeRateLimit.get(telefone) ?? [])
        .filter(t => agora - t < RATE_LIMIT_JANELA_MS);

    if (timestamps.length >= RATE_LIMIT_MAX) return false;

    timestamps.push(agora);
    filipeRateLimit.set(telefone, timestamps);
    return true;
}

// ── Histórico de conversa in-memory — exclusivo do Filipe ───────────────────
const HISTORICO_MAX_TROCAS = 5;   // últimas 5 trocas (user + assistant)
const HISTORICO_TTL_MS = 30 * 60_000; // expira em 30 min de inatividade

interface EntradaHistorico {
    msgs: Array<{ role: 'user' | 'assistant'; content: string }>;
    expireAt: number;
}

const filipeHistorico = new Map<string, EntradaHistorico>();

function getHistorico(telefone: string): Array<{ role: 'user' | 'assistant'; content: string }> {
    const entrada = filipeHistorico.get(telefone);
    if (!entrada || Date.now() > entrada.expireAt) {
        filipeHistorico.delete(telefone);
        return [];
    }
    return entrada.msgs;
}

function salvarHistorico(
    telefone: string,
    mensagemUsuario: string,
    respostaAssistente: string,
) {
    const msgs = getHistorico(telefone);
    msgs.push({ role: 'user', content: mensagemUsuario });
    msgs.push({ role: 'assistant', content: respostaAssistente });

    // Mantém apenas as últimas N trocas (2 mensagens por troca)
    const limite = HISTORICO_MAX_TROCAS * 2;
    const cortado = msgs.length > limite ? msgs.slice(msgs.length - limite) : msgs;

    filipeHistorico.set(telefone, {
        msgs: cortado,
        expireAt: Date.now() + HISTORICO_TTL_MS,
    });
}

// ── Handler principal do Filipe ─────────────────────────────────────────────
async function handleFilipeAssistente(instancia: string, telefone: string, conteudo: string) {
    // Rate limit por número de telefone
    if (!verificarRateLimit(telefone)) {
        await evolutionService.sendText(instancia, telefone,
            '⏳ Muitas mensagens em pouco tempo. Aguarde um momento e tente novamente.');
        return;
    }

    const { authRepository } = await import('../auth/auth.repository');

    const telNormalizado = normalizarTelefone(telefone);
    const telComDDI = `55${telNormalizado}`;

    let user = await authRepository.findByPhone(telNormalizado);
    if (!user) user = await authRepository.findByPhone(telComDDI);
    if (!user) user = await authRepository.findByPhone(telefone);

    if (!user) {
        await evolutionService.sendText(instancia, telefone,
            '❌ Seu número não está cadastrado no sistema.\n\n' +
            'Para usar o assistente, acesse o sistema e cadastre seu número em *Configurações > Assistente IA*.');
        return;
    }

    // Verifica se o plano do corretor inclui o assistente
    const { hasFeature } = await import('../../config/plans');
    const plano = (user as { plano?: string }).plano ?? 'basic';
    if (!hasFeature(plano as 'basic' | 'premium' | 'gold', 'assistente-filipe')) {
        await evolutionService.sendText(instancia, telefone,
            '🔒 O Assistente Filipe está disponível apenas nos planos *Premium* e *Gold*.\n\n' +
            'Fale com seu administrador para fazer o upgrade.');
        return;
    }

    // Recupera histórico da conversa atual
    const historico = getHistorico(telefone);

    const intencao = await assistenteService.processar(conteudo, historico);

    if (intencao.acao === 'registrar_lead') {
        const dados = intencao.dados as { name?: string; telefone?: string; interesse?: string; temperatura?: number };
        if (dados.name && dados.telefone) {
            await leadRepository.create(user.id, {
                name: dados.name,
                telefone: dados.telefone,
                interesse: dados.interesse,
                temperatura: dados.temperatura ?? 1,
            });
        }
    } else if (intencao.acao === 'registrar_venda') {
        const dados = intencao.dados as { valor?: number; status?: string; observacoes?: string };
        if (dados.valor) {
            await vendaRepository.create(user.id, {
                valor: dados.valor,
                status: dados.status ?? 'Em negociação',
                observacoes: dados.observacoes,
            });
        }
    } else if (intencao.acao === 'registrar_imovel') {
        const dados = intencao.dados as { titulo?: string; tipo?: string; preco?: number; cidade?: string };
        if (dados.titulo) {
            await imovelRepository.create(user.id, {
                titulo: dados.titulo,
                tipo: dados.tipo,
                preco: dados.preco,
                cidade: dados.cidade,
            });
        }
    }

    // Salva a troca no histórico para contexto das próximas mensagens
    salvarHistorico(telefone, conteudo, intencao.resposta);

    await evolutionService.sendText(instancia, telefone, intencao.resposta);
}

export const whatsappController = {
    // ── STATUS ──────────────────────────────────
    async getStatus(req: FastifyRequest, reply: FastifyReply) {
        const status = await evolutionService.getStatus(instanceName(req.user.id));
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
        const ok = await evolutionService.sendText(instanceName(req.user.id), telefone, mensagem);
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
            status: 'em_atendimento',
        });
        return reply.send({ ok, conversa_id: conversa.id });
    },

    // ── WEBHOOK ──────────────────────────────────
    async webhook(req: FastifyRequest, reply: FastifyReply) {
        const token = (req.query as Record<string, string>).token
            ?? req.headers['x-webhook-token'];
        if (token !== env.WEBHOOK_SECRET) {
            return reply.status(401).send({ message: 'Não autorizado' });
        }

        const body = req.body as Record<string, unknown>;
        const event = body?.event as string;
        if (event !== 'messages.upsert') return reply.send({ ok: true });

        const data = body?.data as Record<string, unknown>;
        const key = data?.key as Record<string, unknown>;
        if (key?.fromMe) return reply.send({ ok: true });

        const remoteJid = key?.remoteJid as string;
        // Ignora grupos e status broadcast — IA só atende conversas individuais
        if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast')) {
            return reply.send({ ok: true });
        }

        const wamId = key?.id as string | undefined;
        const telefone = remoteJid.replace('@s.whatsapp.net', '');
        const msgContent = data?.message as Record<string, unknown> | undefined;
        const conteudo = (msgContent?.conversation ?? msgContent?.extendedTextMessage
            ? ((msgContent?.extendedTextMessage as Record<string, unknown>)?.text ?? msgContent?.conversation)
            : '[mídia]') as string;
        const instanceName = body?.instance as string;

        if (!telefone || !instanceName) return reply.send({ ok: true });

        // ── Instância do Filipe — roteamento para o assistente ────────────────
        if (env.FILIPE_INSTANCE && instanceName === env.FILIPE_INSTANCE) {
            reply.send({ ok: true });
            // Tenta enfileirar; se Redis não estiver disponível, processa direto
            enfileirarFilipe({ instancia: instanceName, telefone, conteudo })
                .then(enfileirado => {
                    if (!enfileirado) {
                        handleFilipeAssistente(instanceName, telefone, conteudo).catch(console.error);
                    }
                })
                .catch(() => {
                    handleFilipeAssistente(instanceName, telefone, conteudo).catch(console.error);
                });
            return;
        }

        // Responde imediatamente à Evolution API e processa em background
        reply.send({ ok: true });

        // ── Verifica se é resposta a lembrete de visita ──────────────────────
        (async () => {
            try {
                // Deduplicação: ignora mensagem já processada
                if (wamId && await whatsappRepository.existsMensagemByWamId(wamId)) return;
                const visita = await visitaRepository.findPendingLembreteByPhone(telefone);
                if (visita) {
                    const resp = conteudo.trim().toLowerCase();
                    const confirmou = ['1', 'sim', 's', 'confirmo', 'yes'].includes(resp);
                    const recusou = ['2', 'não', 'nao', 'n', 'não posso', 'nao posso'].includes(resp);

                    if (confirmou) {
                        await visitaRepository.marcarConfirmada(visita.id, true);
                        await evolutionService.sendText(instanceName, telefone, '✅ Perfeito! Visita confirmada. Te esperamos lá! 🏡');
                    } else if (recusou) {
                        await visitaRepository.marcarConfirmada(visita.id, false);
                        await evolutionService.sendText(instanceName, telefone, 'Tudo bem! Um de nossos corretores vai entrar em contato. 😊');
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
                        await evolutionService.sendText(instanceName, telefone,
                            'Não entendi sua resposta. 😊\nPor favor, responda:\n*1 - Sim, confirmo ✅*\n*2 - Não poderei ir ❌*');
                    }
                    return; // não processa como flow normal
                }
            } catch (err) {
                console.error('[webhook] Erro ao processar lembrete de visita:', err);
            }

            // ── Processa flow de automação normalmente ───────────────────────
            flowEngine.processIncomingMessage(instanceName, telefone, conteudo, wamId).catch(console.error);
        })();
    },

    // ── IA CONFIG ─────────────────────────────────────
    async getIaConfig(req: FastifyRequest, reply: FastifyReply) {
        const config = await whatsappRepository.getIaConfigByUserId(req.user.id);

        const defaults = {
            ativo: false,
            instancias: [],
            modelo: 'gpt-4o-mini',
            max_tokens: 500,
            temperatura: 0.7,
            prompt_sistema: null,
            regras: [],
        };

        const result = config ?? defaults;

        // Credenciais OpenAI visíveis apenas para o dono da imobiliária
        const isOwner = req.user.role === 'owner';
        if (!isOwner) {
            return reply.send({ ...result, openai_api_key: undefined });
        }
        return reply.send(result);
    },

    async saveIaConfig(req: FastifyRequest, reply: FastifyReply) {
        const iaConfigSchema = z.object({
            ativo: z.boolean().optional(),
            instancias: z.array(z.string()).optional(),
            openai_api_key: z.string().nullable().optional(),
            modelo: z.string().optional(),
            max_tokens: z.number().int().min(100).max(4000).optional(),
            temperatura: z.number().min(0).max(2).optional(),
            prompt_sistema: z.string().nullable().optional(),
            regras: z.array(z.object({
                palavra_chave: z.string().min(1),
                novo_status: z.string().min(1),
                pausar_ia: z.boolean(),
            })).optional(),
        });

        const data = iaConfigSchema.parse(req.body);

        // Apenas o dono pode alterar a chave OpenAI
        if (req.user.role !== 'owner') {
            delete (data as Record<string, unknown>).openai_api_key;
        }

        const instName = instanceName(req.user.id);
        const config = await whatsappRepository.upsertIaConfig(req.user.id, instName, data);

        const isOwner = req.user.role === 'owner';
        if (!isOwner) {
            return reply.send({ ...config, openai_api_key: undefined });
        }
        return reply.send(config);
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
                const ok = await evolutionService.sendText(instanceName(req.user.id), lead.telefone, msgFinal);
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

    // ── CAMPANHAS (novo) ──────────────────────────
    async iniciarCampanha(req: FastifyRequest, reply: FastifyReply) {
        const dados = campanhaSchema.parse(req.body);

        // Resolve leads: por ID direto ou por etapa do kanban
        let leads: Array<{ id: string; name: string; telefone: string; interesse?: string | null }>;
        if (dados.kanban_etapa) {
            leads = await leadRepository.findByKanbanEtapa(req.user.id, dados.kanban_etapa);
        } else {
            const found = await Promise.all(
                dados.leads_ids!.map(id => leadRepository.findById(id, req.user.id)),
            );
            leads = found.filter((l): l is NonNullable<typeof l> => l != null);
        }

        const leadsComTelefone = leads.filter(l => l.telefone);
        if (!leadsComTelefone.length) {
            return reply.status(400).send({ message: 'Nenhum lead com telefone encontrado' });
        }

        // Se veio funil_id, usa a mensagem do primeiro nó MESSAGE do flow
        let mensagemFinal = dados.mensagem;
        if (dados.funil_id) {
            const nodes = await whatsappRepository.listNodes(dados.funil_id);
            const primeiroMsg = nodes.find(n => n.type === 'message' && n.message);
            if (primeiroMsg?.message) mensagemFinal = primeiroMsg.message;
        }

        // Cria registro da campanha
        const disparo = await whatsappRepository.createDisparo(req.user.id, {
            mensagem: mensagemFinal,
            total: leadsComTelefone.length,
            leads_ids: leadsComTelefone.map(l => l.id),
            kanban_etapa: dados.kanban_etapa ?? null,
            funil_id: dados.funil_id ?? null,
            intervalo_segundos: dados.intervalo_segundos,
            status: 'em_andamento',
        });

        // Calcula estimativa de tempo
        const intervaloMs = dados.intervalo_segundos * 1000;
        const tempoEstimadoMin = Math.ceil(
            (leadsComTelefone.length * dados.intervalo_segundos) / 60,
        );

        // Se tem funil, carrega todas as etapas para o runner
        let etapasDoCampanha: Array<{ tipo: 'texto' | 'imagem' | 'video' | 'audio'; conteudo: string; intervalo_antes: number }> | undefined;
        if (dados.funil_id) {
            const etapas = await whatsappRepository.listEtapasByFunilId(dados.funil_id);
            etapasDoCampanha = etapas.map(e => ({
                tipo: e.tipo as 'texto' | 'imagem' | 'video' | 'audio',
                conteudo: e.conteudo,
                intervalo_antes: e.intervalo_antes,
            }));
        }

        // Dispara em background — responde imediatamente
        campanhaRunner.iniciar({
            disparoId: disparo.id,
            userId: req.user.id,
            leads: leadsComTelefone,
            mensagem: mensagemFinal,
            etapas: etapasDoCampanha,
            intervaloMs,
        });

        return reply.status(202).send({
            id: disparo.id,
            total: leadsComTelefone.length,
            intervalo_segundos: dados.intervalo_segundos,
            tempo_estimado_minutos: tempoEstimadoMin,
            status: 'em_andamento',
            message: `Campanha iniciada para ${leadsComTelefone.length} leads (~${tempoEstimadoMin} min)`,
        });
    },

    async getProgresso(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const disparo = await whatsappRepository.findDisparoById(id, req.user.id);
        if (!disparo) return reply.status(404).send({ message: 'Campanha não encontrada' });

        const emExecucao = campanhaRunner.estaRodando(id);
        return reply.send({
            id: disparo.id,
            status: disparo.status,
            total: disparo.total,
            enviados: disparo.enviados,
            falhas: disparo.falhas,
            em_execucao: emExecucao,
            percentual: disparo.total
                ? Math.round(((disparo.enviados ?? 0) + (disparo.falhas ?? 0)) / disparo.total * 100)
                : 0,
        });
    },

    async cancelarCampanha(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const disparo = await whatsappRepository.findDisparoById(id, req.user.id);
        if (!disparo) return reply.status(404).send({ message: 'Campanha não encontrada' });

        const cancelou = campanhaRunner.cancelar(id);
        if (!cancelou) {
            return reply.status(409).send({ message: 'Campanha não está em execução' });
        }
        return reply.send({ message: 'Cancelamento solicitado', id });
    },

    // ── FUNIS DE DISPARO ──────────────────────────
    async listFunis(req: FastifyRequest, reply: FastifyReply) {
        const lista = await whatsappRepository.listFunis(req.user.id);
        return reply.send(lista);
    },

    async getFunilById(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const funil = await whatsappRepository.findFunilById(id, req.user.id);
        if (!funil) return reply.status(404).send({ message: 'Funil não encontrado' });
        return reply.send(funil);
    },

    async createFunil(req: FastifyRequest, reply: FastifyReply) {
        const data = funilSchema.parse(req.body);
        const funil = await whatsappRepository.createFunil(req.user.id, data);
        return reply.status(201).send(funil);
    },

    async updateFunil(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const data = funilSchema.parse(req.body);
        const funil = await whatsappRepository.updateFunil(id, req.user.id, data);
        if (!funil) return reply.status(404).send({ message: 'Funil não encontrado' });
        return reply.send(funil);
    },

    async deleteFunil(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const funil = await whatsappRepository.deleteFunil(id, req.user.id);
        if (!funil) return reply.status(404).send({ message: 'Funil não encontrado' });
        return reply.send({ message: 'Funil excluído' });
    },

    async uploadMidia(req: FastifyRequest, reply: FastifyReply) {
        const data = await req.file();
        if (!data) return reply.status(400).send({ message: 'Nenhum arquivo enviado' });

        const mimetype = data.mimetype ?? '';
        if (!TIPOS_PERMITIDOS.some(t => mimetype.startsWith(t))) {
            return reply.status(400).send({ message: 'Tipo de arquivo não permitido. Use imagem, vídeo ou áudio.' });
        }

        const MAX_BYTES = 25 * 1024 * 1024; // 25MB
        let bytes = 0;
        data.file.on('data', (chunk: Buffer) => { bytes += chunk.length; });

        try {
            await mkdir(UPLOADS_DIR, { recursive: true });
            const ext = extname(data.filename) || '.bin';
            const filename = `${randomUUID()}${ext}`;
            const filepath = `${UPLOADS_DIR}/${filename}`;

            await pipeline(data.file, createWriteStream(filepath));

            if (bytes > MAX_BYTES) {
                return reply.status(400).send({ message: 'Arquivo excede o limite de 25MB' });
            }

            const url = `${env.API_URL}/uploads/${filename}`;
            return reply.send({ url });
        } catch {
            return reply.status(500).send({ message: 'Erro ao salvar arquivo' });
        }
    },

    async serveUpload(req: FastifyRequest, reply: FastifyReply) {
        const { filename } = req.params as { filename: string };
        if (filename.includes('..') || filename.includes('/')) {
            return reply.status(400).send({ message: 'Inválido' });
        }
        const filepath = `${UPLOADS_DIR}/${filename}`;
        try {
            await access(filepath);
            return reply.send(createReadStream(filepath));
        } catch {
            return reply.status(404).send({ message: 'Arquivo não encontrado' });
        }
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

    // ── CRIAR INSTÂNCIA (controlado) ─────────────────────────────────────────
    async createInstance(req: FastifyRequest, reply: FastifyReply) {
        const name = instanceName(req.user.id);
        const response = await fetch(`${env.EVOLUTION_API_URL}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': env.EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
                instanceName: name,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
            }),
        });
        const data = await response.json();
        return reply.status(response.status).send(data);
    },

    // ── EVOLUTION PROXY ───────────────────────────────────────────────────────
    // Repassa chamadas para a Evolution API bloqueando endpoints destrutivos
    async evolutionProxy(req: FastifyRequest, reply: FastifyReply) {
        const wildcard = (req.params as Record<string, string>)['*'] ?? '';

        const BLOCKED = ['instance/logout', 'instance/delete', 'instance/restart'];
        if (BLOCKED.some(path => wildcard.toLowerCase().startsWith(path))) {
            return reply.status(403).send({ message: 'Endpoint bloqueado por segurança' });
        }

        // Criação de instância é controlada — deriva o nome do user.id
        if (wildcard.toLowerCase() === 'instance/create') {
            return whatsappController.createInstance(req, reply);
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

// Exportado para uso pelo worker BullMQ em filipe.queue.ts / main.ts
export { handleFilipeAssistente as handleFilipeAssistenteExterno };