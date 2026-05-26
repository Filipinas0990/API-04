"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assistenteService = void 0;
const env_1 = require("../../config/env");
const FALLBACK = {
    acao: 'desconhecido',
    dados: {},
    resposta: 'Desculpe, não consegui processar agora. Tente novamente em instantes.',
};
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function chamarOpenAI(mensagem, historico) {
    const systemPrompt = `Você é um assistente de CRM imobiliário.
Quando um corretor enviar uma mensagem, identifique a intenção e extraia os dados.

Responda SEMPRE em JSON com este formato:
{
  "acao": "registrar_lead" | "registrar_venda" | "registrar_imovel" | "consultar" | "desconhecido",
  "dados": { ... campos extraídos ... },
  "resposta": "mensagem amigável para o corretor"
}

Para registrar_lead, extraia: name, telefone, interesse, temperatura (1=frio, 2=morno, 3=quente)
Para registrar_venda, extraia: valor, status, observacoes
Para registrar_imovel, extraia: titulo, tipo, preco, cidade, endereco
Para consultar, retorne apenas a resposta
Para desconhecido, peça mais informações`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env_1.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...historico,
                { role: 'user', content: mensagem },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 500,
        }),
    });
    if (!res.ok) {
        const err = new Error(`OpenAI HTTP ${res.status}`);
        err.code = String(res.status);
        throw err;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    return JSON.parse(content);
}
exports.assistenteService = {
    async processar(mensagem, historico = []) {
        const MAX_TENTATIVAS = 3;
        const DELAYS_MS = [1000, 2000, 4000];
        for (let tentativa = 0; tentativa < MAX_TENTATIVAS; tentativa++) {
            try {
                return await chamarOpenAI(mensagem, historico);
            }
            catch (err) {
                const status = err.code;
                const isRetryable = status === '429' || (Number(status) >= 500);
                const isUltimaTentativa = tentativa === MAX_TENTATIVAS - 1;
                if (!isRetryable || isUltimaTentativa) {
                    console.error(`[Filipe] OpenAI erro após ${tentativa + 1} tentativa(s):`, err);
                    return FALLBACK;
                }
                console.warn(`[Filipe] OpenAI erro ${status}, tentativa ${tentativa + 1}/${MAX_TENTATIVAS}. Aguardando ${DELAYS_MS[tentativa]}ms...`);
                await sleep(DELAYS_MS[tentativa]);
            }
        }
        return FALLBACK;
    },
};
//# sourceMappingURL=assistente.service.js.map