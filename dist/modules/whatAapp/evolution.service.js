"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evolutionService = void 0;
const env_1 = require("../../config/env");
const BASE_URL = env_1.env.EVOLUTION_API_URL;
const API_KEY = env_1.env.EVOLUTION_API_KEY;
const headers = {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
};
// Garante que números brasileiros tenham o código do país (55)
function normalizarTelefone(numero) {
    const digits = numero.replace(/\D/g, '');
    // Já tem código do país (12–13 dígitos, começa com 55)
    if (digits.startsWith('55') && digits.length >= 12)
        return digits;
    // Remove zero de discagem longa (0XX...)
    const sem0 = digits.startsWith('0') ? digits.slice(1) : digits;
    // Número brasileiro sem código: 10 ou 11 dígitos
    if (sem0.length === 10 || sem0.length === 11)
        return `55${sem0}`;
    return digits;
}
exports.evolutionService = {
    // Envia mensagem de texto
    async sendText(instanceName, telefone, mensagem) {
        const number = normalizarTelefone(telefone);
        try {
            const res = await fetch(`${BASE_URL}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ number, text: mensagem }),
            });
            if (!res.ok) {
                let body = '';
                try {
                    body = await res.text();
                }
                catch { /* ignore */ }
                console.error(`[evolution] sendText falhou — status=${res.status} instance=${instanceName} number=${number} body=${body}`);
            }
            return res.ok;
        }
        catch (err) {
            console.error(`[evolution] sendText erro de rede — instance=${instanceName} number=${number}`, err);
            return false;
        }
    },
    // Envia mídia (imagem, vídeo ou áudio) por URL pública
    async sendMedia(instanceName, telefone, tipo, mediaUrl, caption = '') {
        const number = normalizarTelefone(telefone);
        try {
            const mediatype = tipo === 'imagem' ? 'image' : tipo === 'video' ? 'video' : 'audio';
            const res = await fetch(`${BASE_URL}/message/sendMedia/${instanceName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ number, mediatype, caption, media: mediaUrl }),
            });
            return res.ok;
        }
        catch {
            return false;
        }
    },
    // Mostra indicador de "digitando..." para o contato
    async sendTyping(instanceName, telefone, duracaoMs = 3000) {
        try {
            await fetch(`${BASE_URL}/chat/sendPresence/${instanceName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    number: telefone,
                    options: { presence: 'composing', delay: duracaoMs },
                }),
            });
        }
        catch {
            // best-effort — não bloqueia o fluxo
        }
    },
    // Verifica status da instância
    async getStatus(instanceName) {
        try {
            const res = await fetch(`${BASE_URL}/instance/connectionState/${instanceName}`, { headers });
            const data = await res.json();
            return {
                connected: data?.instance?.state === 'open',
                instance: instanceName,
            };
        }
        catch {
            return { connected: false, instance: instanceName };
        }
    },
};
//# sourceMappingURL=evolution.service.js.map