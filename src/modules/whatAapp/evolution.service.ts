import { env } from '../../config/env';

const BASE_URL = env.EVOLUTION_API_URL;
const API_KEY = env.EVOLUTION_API_KEY;
const INSTANCE = env.EVOLUTION_INSTANCE;

const headers = {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
};

export const evolutionService = {
    // Envia mensagem de texto
    async sendText(telefone: string, mensagem: string): Promise<boolean> {
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
        } catch {
            return false;
        }
    },

    // Verifica status da instância
    async getStatus(): Promise<{ connected: boolean; instance: string }> {
        try {
            const res = await fetch(`${BASE_URL}/instance/connectionState/${INSTANCE}`, { headers });
            const data = await res.json() as { instance?: { state?: string } };
            return {
                connected: data?.instance?.state === 'open',
                instance: INSTANCE,
            };
        } catch {
            return { connected: false, instance: INSTANCE };
        }
    },
};