"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappController = void 0;
exports.handleFilipeAssistenteExterno = handleFilipeAssistente;
const zod_1 = require("zod");
const promises_1 = require("stream/promises");
const fs_1 = require("fs");
const promises_2 = require("fs/promises");
const crypto_1 = require("crypto");
const path_1 = require("path");
const whatsapp_repository_1 = require("./whatsapp.repository");
const evolution_service_1 = require("./evolution.service");
const assistente_service_1 = require("./assistente.service");
const filipe_queue_1 = require("./filipe.queue");
const flow_engine_1 = require("./flow.engine");
const campanha_runner_1 = require("./campanha.runner");
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
// Etapas válidas do kanban (= status do lead)
const KANBAN_ETAPAS = [
    'novo_cliente', 'em_contato', 'visita_marcada', 'proposta_enviada', 'cliente_desistiu',
];
const funilSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1).max(100),
    descricao: zod_1.z.string().max(500).optional(),
    etapas: zod_1.z.array(zod_1.z.object({
        tipo: zod_1.z.enum(['texto', 'imagem', 'video', 'audio']),
        conteudo: zod_1.z.string().default(''),
        ordem: zod_1.z.number().int().min(0),
        intervalo_antes: zod_1.z.number().int().min(0).max(3600).default(0),
    })).min(1),
});
const UPLOADS_DIR = '/app/uploads';
const TIPOS_PERMITIDOS = ['image/', 'video/', 'audio/'];
const campanhaSchema = zod_1.z.object({
    // Origem dos leads: lista direta OU etapa do kanban
    leads_ids: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(200).optional(),
    kanban_etapa: zod_1.z.enum(KANBAN_ETAPAS).optional(),
    mensagem: zod_1.z.string().min(1),
    funil_id: zod_1.z.string().uuid().optional(),
    // Intervalo anti-ban: 60s padrão, mínimo 30s, máximo 1h
    intervalo_segundos: zod_1.z.number().int().min(30).max(3600).default(60),
}).refine(d => d.leads_ids?.length || d.kanban_etapa, {
    message: 'Informe leads_ids ou kanban_etapa',
});
const automacaoSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1),
    ativo: zod_1.z.boolean().default(false),
    trigger: zod_1.z.string().default('sempre'),
    palavra_chave: zod_1.z.string().optional(),
    nos: zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.unknown())).default([]),
});
function instanceName(userId) {
    return `inst-${userId.split('-')[0]}`;
}
function normalizarTelefone(tel) {
    const digitos = tel.replace(/\D/g, '');
    if (digitos.startsWith('55') && digitos.length >= 12) {
        return digitos.slice(2);
    }
    return digitos;
}
// ── Rate limiting — exclusivo do Filipe ─────────────────────────────────────
const RATE_LIMIT_MAX = 10; // máximo de mensagens por janela
const RATE_LIMIT_JANELA_MS = 60_000; // janela de 1 minuto
const filipeRateLimit = new Map();
function verificarRateLimit(telefone) {
    const agora = Date.now();
    const timestamps = (filipeRateLimit.get(telefone) ?? [])
        .filter(t => agora - t < RATE_LIMIT_JANELA_MS);
    if (timestamps.length >= RATE_LIMIT_MAX)
        return false;
    timestamps.push(agora);
    filipeRateLimit.set(telefone, timestamps);
    return true;
}
// ── Histórico de conversa in-memory — exclusivo do Filipe ───────────────────
const HISTORICO_MAX_TROCAS = 5; // últimas 5 trocas (user + assistant)
const HISTORICO_TTL_MS = 30 * 60_000; // expira em 30 min de inatividade
const filipeHistorico = new Map();
function getHistorico(telefone) {
    const entrada = filipeHistorico.get(telefone);
    if (!entrada || Date.now() > entrada.expireAt) {
        filipeHistorico.delete(telefone);
        return [];
    }
    return entrada.msgs;
}
function salvarHistorico(telefone, mensagemUsuario, respostaAssistente) {
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
async function handleFilipeAssistente(instancia, telefone, conteudo) {
    // Rate limit por número de telefone
    if (!verificarRateLimit(telefone)) {
        await evolution_service_1.evolutionService.sendText(instancia, telefone, '⏳ Muitas mensagens em pouco tempo. Aguarde um momento e tente novamente.');
        return;
    }
    const { authRepository } = await Promise.resolve().then(() => __importStar(require('../auth/auth.repository')));
    const telNormalizado = normalizarTelefone(telefone);
    const telComDDI = `55${telNormalizado}`;
    let user = await authRepository.findByPhone(telNormalizado);
    if (!user)
        user = await authRepository.findByPhone(telComDDI);
    if (!user)
        user = await authRepository.findByPhone(telefone);
    if (!user) {
        await evolution_service_1.evolutionService.sendText(instancia, telefone, '❌ Seu número não está cadastrado no sistema.\n\n' +
            'Para usar o assistente, acesse o sistema e cadastre seu número em *Configurações > Assistente IA*.');
        return;
    }
    // Recupera histórico da conversa atual
    const historico = getHistorico(telefone);
    const intencao = await assistente_service_1.assistenteService.processar(conteudo, historico);
    if (intencao.acao === 'registrar_lead') {
        const dados = intencao.dados;
        if (dados.name && dados.telefone) {
            await lead_repository_1.leadRepository.create(user.id, {
                name: dados.name,
                telefone: dados.telefone,
                interesse: dados.interesse,
                temperatura: dados.temperatura ?? 1,
            });
        }
    }
    else if (intencao.acao === 'registrar_venda') {
        const dados = intencao.dados;
        if (dados.valor) {
            await venda_repository_1.vendaRepository.create(user.id, {
                valor: dados.valor,
                status: dados.status ?? 'Em negociação',
                observacoes: dados.observacoes,
            });
        }
    }
    else if (intencao.acao === 'registrar_imovel') {
        const dados = intencao.dados;
        if (dados.titulo) {
            await imovel_repository_1.imovelRepository.create(user.id, {
                titulo: dados.titulo,
                tipo: dados.tipo,
                preco: dados.preco,
                cidade: dados.cidade,
            });
        }
    }
    // Salva a troca no histórico para contexto das próximas mensagens
    salvarHistorico(telefone, conteudo, intencao.resposta);
    await evolution_service_1.evolutionService.sendText(instancia, telefone, intencao.resposta);
}
exports.whatsappController = {
    // ── STATUS ──────────────────────────────────
    async getStatus(req, reply) {
        const status = await evolution_service_1.evolutionService.getStatus(instanceName(req.user.id));
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
        const ok = await evolution_service_1.evolutionService.sendText(instanceName(req.user.id), telefone, mensagem);
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
            status: 'em_atendimento',
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
        const remoteJid = key?.remoteJid;
        // Ignora grupos e status broadcast — IA só atende conversas individuais
        if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast')) {
            return reply.send({ ok: true });
        }
        const wamId = key?.id;
        const telefone = remoteJid.replace('@s.whatsapp.net', '');
        const msgContent = data?.message;
        const conteudo = (msgContent?.conversation ?? msgContent?.extendedTextMessage
            ? (msgContent?.extendedTextMessage?.text ?? msgContent?.conversation)
            : '[mídia]');
        const instanceName = body?.instance;
        if (!telefone || !instanceName)
            return reply.send({ ok: true });
        // ── Instância do Filipe — roteamento para o assistente ────────────────
        if (env_1.env.FILIPE_INSTANCE && instanceName === env_1.env.FILIPE_INSTANCE) {
            reply.send({ ok: true });
            // Tenta enfileirar; se Redis não estiver disponível, processa direto
            (0, filipe_queue_1.enfileirarFilipe)({ instancia: instanceName, telefone, conteudo })
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
                if (wamId && await whatsapp_repository_1.whatsappRepository.existsMensagemByWamId(wamId))
                    return;
                const visita = await visita_repository_1.visitaRepository.findPendingLembreteByPhone(telefone);
                if (visita) {
                    const resp = conteudo.trim().toLowerCase();
                    const confirmou = ['1', 'sim', 's', 'confirmo', 'yes'].includes(resp);
                    const recusou = ['2', 'não', 'nao', 'n', 'não posso', 'nao posso'].includes(resp);
                    if (confirmou) {
                        await visita_repository_1.visitaRepository.marcarConfirmada(visita.id, true);
                        await evolution_service_1.evolutionService.sendText(instanceName, telefone, '✅ Perfeito! Visita confirmada. Te esperamos lá! 🏡');
                    }
                    else if (recusou) {
                        await visita_repository_1.visitaRepository.marcarConfirmada(visita.id, false);
                        await evolution_service_1.evolutionService.sendText(instanceName, telefone, 'Tudo bem! Um de nossos corretores vai entrar em contato. 😊');
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
                        await evolution_service_1.evolutionService.sendText(instanceName, telefone, 'Não entendi sua resposta. 😊\nPor favor, responda:\n*1 - Sim, confirmo ✅*\n*2 - Não poderei ir ❌*');
                    }
                    return; // não processa como flow normal
                }
            }
            catch (err) {
                console.error('[webhook] Erro ao processar lembrete de visita:', err);
            }
            // ── Processa flow de automação normalmente ───────────────────────
            flow_engine_1.flowEngine.processIncomingMessage(instanceName, telefone, conteudo, wamId).catch(console.error);
        })();
    },
    // ── IA CONFIG ─────────────────────────────────────
    async getIaConfig(req, reply) {
        const config = await whatsapp_repository_1.whatsappRepository.getIaConfigByUserId(req.user.id);
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
    async saveIaConfig(req, reply) {
        const iaConfigSchema = zod_1.z.object({
            ativo: zod_1.z.boolean().optional(),
            instancias: zod_1.z.array(zod_1.z.string()).optional(),
            openai_api_key: zod_1.z.string().nullable().optional(),
            modelo: zod_1.z.string().optional(),
            max_tokens: zod_1.z.number().int().min(100).max(4000).optional(),
            temperatura: zod_1.z.number().min(0).max(2).optional(),
            prompt_sistema: zod_1.z.string().nullable().optional(),
            regras: zod_1.z.array(zod_1.z.object({
                palavra_chave: zod_1.z.string().min(1),
                novo_status: zod_1.z.string().min(1),
                pausar_ia: zod_1.z.boolean(),
            })).optional(),
        });
        const data = iaConfigSchema.parse(req.body);
        // Apenas o dono pode alterar a chave OpenAI
        if (req.user.role !== 'owner') {
            delete data.openai_api_key;
        }
        const instName = instanceName(req.user.id);
        const config = await whatsapp_repository_1.whatsappRepository.upsertIaConfig(req.user.id, instName, data);
        const isOwner = req.user.role === 'owner';
        if (!isOwner) {
            return reply.send({ ...config, openai_api_key: undefined });
        }
        return reply.send(config);
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
                const ok = await evolution_service_1.evolutionService.sendText(instanceName(req.user.id), lead.telefone, msgFinal);
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
    // ── CAMPANHAS (novo) ──────────────────────────
    async iniciarCampanha(req, reply) {
        const dados = campanhaSchema.parse(req.body);
        // Resolve leads: por ID direto ou por etapa do kanban
        let leads;
        if (dados.kanban_etapa) {
            leads = await lead_repository_1.leadRepository.findByKanbanEtapa(req.user.id, dados.kanban_etapa);
        }
        else {
            const found = await Promise.all(dados.leads_ids.map(id => lead_repository_1.leadRepository.findById(id, req.user.id)));
            leads = found.filter((l) => l != null);
        }
        const leadsComTelefone = leads.filter(l => l.telefone);
        if (!leadsComTelefone.length) {
            return reply.status(400).send({ message: 'Nenhum lead com telefone encontrado' });
        }
        // Se veio funil_id, usa a mensagem do primeiro nó MESSAGE do flow
        let mensagemFinal = dados.mensagem;
        if (dados.funil_id) {
            const nodes = await whatsapp_repository_1.whatsappRepository.listNodes(dados.funil_id);
            const primeiroMsg = nodes.find(n => n.type === 'message' && n.message);
            if (primeiroMsg?.message)
                mensagemFinal = primeiroMsg.message;
        }
        // Cria registro da campanha
        const disparo = await whatsapp_repository_1.whatsappRepository.createDisparo(req.user.id, {
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
        const tempoEstimadoMin = Math.ceil((leadsComTelefone.length * dados.intervalo_segundos) / 60);
        // Se tem funil, carrega todas as etapas para o runner
        let etapasDoCampanha;
        if (dados.funil_id) {
            const etapas = await whatsapp_repository_1.whatsappRepository.listEtapasByFunilId(dados.funil_id);
            etapasDoCampanha = etapas.map(e => ({
                tipo: e.tipo,
                conteudo: e.conteudo,
                intervalo_antes: e.intervalo_antes,
            }));
        }
        // Dispara em background — responde imediatamente
        campanha_runner_1.campanhaRunner.iniciar({
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
    async getProgresso(req, reply) {
        const { id } = req.params;
        const disparo = await whatsapp_repository_1.whatsappRepository.findDisparoById(id, req.user.id);
        if (!disparo)
            return reply.status(404).send({ message: 'Campanha não encontrada' });
        const emExecucao = campanha_runner_1.campanhaRunner.estaRodando(id);
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
    async cancelarCampanha(req, reply) {
        const { id } = req.params;
        const disparo = await whatsapp_repository_1.whatsappRepository.findDisparoById(id, req.user.id);
        if (!disparo)
            return reply.status(404).send({ message: 'Campanha não encontrada' });
        const cancelou = campanha_runner_1.campanhaRunner.cancelar(id);
        if (!cancelou) {
            return reply.status(409).send({ message: 'Campanha não está em execução' });
        }
        return reply.send({ message: 'Cancelamento solicitado', id });
    },
    // ── FUNIS DE DISPARO ──────────────────────────
    async listFunis(req, reply) {
        const lista = await whatsapp_repository_1.whatsappRepository.listFunis(req.user.id);
        return reply.send(lista);
    },
    async getFunilById(req, reply) {
        const { id } = req.params;
        const funil = await whatsapp_repository_1.whatsappRepository.findFunilById(id, req.user.id);
        if (!funil)
            return reply.status(404).send({ message: 'Funil não encontrado' });
        return reply.send(funil);
    },
    async createFunil(req, reply) {
        const data = funilSchema.parse(req.body);
        const funil = await whatsapp_repository_1.whatsappRepository.createFunil(req.user.id, data);
        return reply.status(201).send(funil);
    },
    async updateFunil(req, reply) {
        const { id } = req.params;
        const data = funilSchema.parse(req.body);
        const funil = await whatsapp_repository_1.whatsappRepository.updateFunil(id, req.user.id, data);
        if (!funil)
            return reply.status(404).send({ message: 'Funil não encontrado' });
        return reply.send(funil);
    },
    async deleteFunil(req, reply) {
        const { id } = req.params;
        const funil = await whatsapp_repository_1.whatsappRepository.deleteFunil(id, req.user.id);
        if (!funil)
            return reply.status(404).send({ message: 'Funil não encontrado' });
        return reply.send({ message: 'Funil excluído' });
    },
    async uploadMidia(req, reply) {
        const data = await req.file();
        if (!data)
            return reply.status(400).send({ message: 'Nenhum arquivo enviado' });
        const mimetype = data.mimetype ?? '';
        if (!TIPOS_PERMITIDOS.some(t => mimetype.startsWith(t))) {
            return reply.status(400).send({ message: 'Tipo de arquivo não permitido. Use imagem, vídeo ou áudio.' });
        }
        const MAX_BYTES = 25 * 1024 * 1024; // 25MB
        let bytes = 0;
        data.file.on('data', (chunk) => { bytes += chunk.length; });
        try {
            await (0, promises_2.mkdir)(UPLOADS_DIR, { recursive: true });
            const ext = (0, path_1.extname)(data.filename) || '.bin';
            const filename = `${(0, crypto_1.randomUUID)()}${ext}`;
            const filepath = `${UPLOADS_DIR}/${filename}`;
            await (0, promises_1.pipeline)(data.file, (0, fs_1.createWriteStream)(filepath));
            if (bytes > MAX_BYTES) {
                return reply.status(400).send({ message: 'Arquivo excede o limite de 25MB' });
            }
            const url = `${env_1.env.API_URL}/uploads/${filename}`;
            return reply.send({ url });
        }
        catch {
            return reply.status(500).send({ message: 'Erro ao salvar arquivo' });
        }
    },
    async serveUpload(req, reply) {
        const { filename } = req.params;
        if (filename.includes('..') || filename.includes('/')) {
            return reply.status(400).send({ message: 'Inválido' });
        }
        const filepath = `${UPLOADS_DIR}/${filename}`;
        try {
            await (0, promises_2.access)(filepath);
            return reply.send((0, fs_1.createReadStream)(filepath));
        }
        catch {
            return reply.status(404).send({ message: 'Arquivo não encontrado' });
        }
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
    // ── CRIAR INSTÂNCIA (controlado) ─────────────────────────────────────────
    async createInstance(req, reply) {
        const name = instanceName(req.user.id);
        const response = await fetch(`${env_1.env.EVOLUTION_API_URL}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': env_1.env.EVOLUTION_API_KEY,
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
    async evolutionProxy(req, reply) {
        const wildcard = req.params['*'] ?? '';
        const BLOCKED = ['instance/logout', 'instance/delete', 'instance/restart'];
        if (BLOCKED.some(path => wildcard.toLowerCase().startsWith(path))) {
            return reply.status(403).send({ message: 'Endpoint bloqueado por segurança' });
        }
        // Criação de instância é controlada — deriva o nome do user.id
        if (wildcard.toLowerCase() === 'instance/create') {
            return exports.whatsappController.createInstance(req, reply);
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