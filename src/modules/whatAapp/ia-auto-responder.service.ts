import { whatsappRepository } from './whatsapp.repository';
import { evolutionService } from './evolution.service';
import { env } from '../../config/env';

type Regra = { palavra_chave: string; novo_status: string; pausar_ia: boolean };

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
        const maxTokens = config.max_tokens ?? 500;
        const temperatura = config.temperatura ?? 0.7;
        const systemPrompt = config.prompt_sistema ?? 'Você é um assistente de atendimento imobiliário. Responda de forma cordial e objetiva.';

        try {
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
                        // Regra manda pausar — transfere para humano sem enviar resposta da IA
                        return true;
                    }
                }
            }

            // Envia a resposta e salva no histórico
            await evolutionService.sendText(instanceName, telefone, resposta);
            await whatsappRepository.saveMensagem({
                user_id: userId,
                conversa_id: conversaId,
                telefone,
                direcao: 'enviada',
                conteudo: resposta,
            });
            await whatsappRepository.updateConversaById(conversaId, userId, {
                ultima_msg: resposta,
                ultima_msg_em: new Date(),
            });

            return true;
        } catch (err) {
            console.error('[IA] Erro ao chamar OpenAI:', err);
            return false;
        }
    },
};
