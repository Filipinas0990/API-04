"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evolutionService = void 0;
const env_1 = require("../../config/env");
const BASE_URL = env_1.env.EVOLUTION_API_URL;
const API_KEY = env_1.env.EVOLUTION_API_KEY;
const INSTANCE = env_1.env.EVOLUTION_INSTANCE;
const headers = {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
};
exports.evolutionService = {
    // Envia mensagem de texto
    async sendText(telefone, mensagem) {
        try {
            const res = await fetch(`${BASE_URL}/message/sendText/${INSTANCE}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    number: telefone,
                    text: mensagem,
                }),
            });
            return res.ok;
        }
        catch {
            return false;
        }
    },
    // Verifica status da instância
    async getStatus() {
        try {
            const res = await fetch(`${BASE_URL}/instance/connectionState/${INSTANCE}`, { headers });
            const data = await res.json();
            return {
                connected: data?.instance?.state === 'open',
                instance: INSTANCE,
            };
        }
        catch {
            return { connected: false, instance: INSTANCE };
        }
    },
};
//# sourceMappingURL=evolution.service.js.map