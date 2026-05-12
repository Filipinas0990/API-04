"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assistenteService = void 0;
const env_1 = require("../../config/env");
exports.assistenteService = {
    async processar(mensagem, historico = []) {
        try {
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
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content ?? '{}';
            return JSON.parse(content);
        }
        catch {
            return {
                acao: 'desconhecido',
                dados: {},
                resposta: 'Desculpe, não entendi. Pode reformular?',
            };
        }
    },
};
//# sourceMappingURL=assistente.service.js.map