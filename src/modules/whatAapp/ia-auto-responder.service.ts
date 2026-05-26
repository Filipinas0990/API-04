import { whatsappRepository } from './whatsapp.repository';
import { evolutionService } from './evolution.service';
import { leadRepository } from '../leads/lead.repository';
import { etiquetaRepository } from '../etiquetas/etiqueta.repository';
import { env } from '../../config/env';

type Regra = { palavra_chave: string; novo_status: string; pausar_ia: boolean };

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Retorna "Bom dia", "Boa tarde" ou "Boa noite" conforme horário de Brasília
function saudacao(): string {
    const hora = new Date(Date.now() - 3 * 60 * 60 * 1000).getUTCHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
}

// Divide a resposta em duas partes no primeiro ponto/exclamação/interrogação
function dividirResposta(texto: string): [string, string | null] {
    const match = texto.match(/^(.+?[.!?])\s+(.+)$/s);
    if (match && match[1].length > 10 && match[2].length > 5) {
        return [match[1].trim(), match[2].trim()];
    }
    return [texto, null];
}

async function extractLeadInfo(
    apiKey: string,
    userMessages: string[],
): Promise<{ nome?: string | null; interesse?: string | null } | null> {
    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Extraia o primeiro nome e o interesse imobiliário das mensagens do cliente. Responda SOMENTE com JSON: {"nome": "string ou null", "interesse": "string ou null"}. Interesse pode ser: tipo de imóvel, comprar/alugar, região, etc. Se não encontrar, use null.',
                    },
                    { role: 'user', content: userMessages.join('\n') },
                ],
                max_tokens: 60,
                temperature: 0,
                response_format: { type: 'json_object' },
            }),
        });
        if (!res.ok) return null;
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const content = data?.choices?.[0]?.message?.content;
        if (!content) return null;
        return JSON.parse(content) as { nome?: string | null; interesse?: string | null };
    } catch {
        return null;
    }
}

export const iaAutoResponder = {
    async handle(
        instanceName: string,
        telefone: string,
        conteudo: string,
        userId: string,
        conversaId: string,
        conversaStatus: string,
    ): Promise<boolean> {
        // IA só atende conversas pendentes ou fechadas
        if (conversaStatus === 'em_atendimento') return false;

        const config = await whatsappRepository.getIaConfigByUserId(userId);
        if (!config?.ativo) return false;

        // Verifica se a instância está na lista permitida (vazio = todas)
        const instancias = (config.instancias as string[]) ?? [];
        if (instancias.length > 0 && !instancias.includes(instanceName)) return false;

        // Histórico das últimas 10 mensagens para contexto
        const recentMsgs = await whatsappRepository.listMensagens(conversaId, userId, 10, 0);
        const historico = recentMsgs
            .filter(m => m.conteudo !== '[mídia]')
            .map(m => ({
                role: m.direcao === 'enviada' ? 'assistant' as const : 'user' as const,
                content: m.conteudo,
            }));

        const apiKey = config.openai_api_key || env.OPENAI_API_KEY;
        const modelo = config.modelo ?? 'gpt-4o-mini';
        const maxTokens = config.max_tokens ?? 120;
        const temperatura = config.temperatura ?? 0.7;
        const isPrimeiraMsg = historico.filter(m => m.role === 'assistant').length === 0;
        const systemPrompt = config.prompt_sistema
            ?? `Você é uma atendente humana de uma imobiliária. NUNCA revele que é uma IA ou robô. Se perguntarem, diga que é uma atendente. NUNCA use emojis. ${isPrimeiraMsg ? `Comece com "${saudacao()}!" de forma natural.` : ''} Seu objetivo é: 1) Descobrir o nome do cliente de forma natural. 2) Entender o interesse dele (comprar, alugar, qual tipo de imóvel, qual região). Mantenha a conversa fluindo com perguntas naturais. Seja breve — máximo 2 linhas. Nunca prometa nada, nunca mencione transferências.`;

        try {
            // Delay inicial aleatório — simula humano "lendo" a mensagem antes de digitar
            await sleep(randomInt(1500, 3500));

            // Tempo de digitação proporcional ao tamanho esperado da resposta
            const typingMs = randomInt(2000, 4500);
            evolutionService.sendTyping(instanceName, telefone, typingMs);

            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: modelo,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...historico,
                        { role: 'user', content: conteudo },
                    ],
                    max_tokens: maxTokens,
                    temperature: temperatura,
                }),
            });

            if (!res.ok) {
                console.error('[IA] OpenAI retornou erro:', res.status);
                return false;
            }

            const data = await res.json() as {
                choices?: Array<{ message?: { content?: string } }>;
            };
            const resposta = data?.choices?.[0]?.message?.content?.trim();
            if (!resposta) return false;

            // Verifica regras de resposta — palavras-chave que alteram status ou pausam IA
            const regras = (config.regras as Regra[]) ?? [];
            for (const regra of regras) {
                if (resposta.toLowerCase().includes(regra.palavra_chave.toLowerCase())) {
                    await whatsappRepository.updateConversaById(conversaId, userId, { status: regra.novo_status });
                    if (regra.pausar_ia) {
                        return true;
                    }
                }
            }

            // Divide a resposta em 2 partes se possível — mais natural
            const [parte1, parte2] = dividirResposta(resposta);

            await evolutionService.sendText(instanceName, telefone, parte1);
            await whatsappRepository.saveMensagem({
                user_id: userId, conversa_id: conversaId,
                telefone, direcao: 'enviada', conteudo: parte1,
            });

            if (parte2) {
                // Pausa + nova digitação antes da segunda mensagem
                await sleep(randomInt(800, 1800));
                const typing2Ms = randomInt(1000, 2500);
                evolutionService.sendTyping(instanceName, telefone, typing2Ms);
                await sleep(typing2Ms);

                await evolutionService.sendText(instanceName, telefone, parte2);
                await whatsappRepository.saveMensagem({
                    user_id: userId, conversa_id: conversaId,
                    telefone, direcao: 'enviada', conteudo: parte2,
                });
            }

            await whatsappRepository.updateConversaById(conversaId, userId, {
                ultima_msg: parte2 ?? parte1,
                ultima_msg_em: new Date(),
            });

            // Tenta capturar nome/interesse do cliente para enriquecer o lead
            const userMessages = historico
                .filter(m => m.role === 'user')
                .map(m => m.content);

            if (userMessages.length > 0) {
                const lead = await leadRepository.findByPhone(userId, telefone);
                const precisaNome = !lead || lead.name === telefone;
                const precisaInteresse = !lead?.interesse;

                if (precisaNome || precisaInteresse) {
                    const extracted = await extractLeadInfo(apiKey, userMessages);
                    if (extracted) {
                        if (lead) {
                            const updates: Record<string, string> = {};
                            if (extracted.nome && precisaNome) updates.name = extracted.nome;
                            if (extracted.interesse && precisaInteresse) updates.interesse = extracted.interesse;
                            if (Object.keys(updates).length > 0) {
                                await leadRepository.update(lead.id, userId, updates);
                            }
                        } else if (extracted.nome) {
                            await leadRepository.create(userId, {
                                name: extracted.nome,
                                telefone,
                                interesse: extracted.interesse ?? undefined,
                                temperatura: 1,
                            });
                        }
                        if (extracted.nome) {
                            await whatsappRepository.updateConversaById(conversaId, userId, { nome: extracted.nome });
                        }
                    }
                }
            }

            // Auto-tag por keyword: aplica etiquetas cujo keyword_trigger está contido na mensagem
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

            return true;
        } catch (err) {
            console.error('[IA] Erro ao chamar OpenAI:', err);
            return false;
        }
    },
};
