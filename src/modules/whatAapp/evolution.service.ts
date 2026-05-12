import { env } from '../../config/env';

const BASE_URL = env.EVOLUTION_API_URL;
const API_KEY = env.EVOLUTION_API_KEY;

const headers = {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
};

export const evolutionService = {
    // Envia mensagem de texto
    async sendText(instanceName: string, telefone: string, mensagem: string): Promise<boolean> {
        try {
            const res = await fetch(`${BASE_URL}/message/sendText/${instanceName}`, {
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
    async getStatus(instanceName: string): Promise<{ connected: boolean; instance: string }> {
        try {
            const res = await fetch(`${BASE_URL}/instance/connectionState/${instanceName}`, { headers });
            const data = await res.json() as { instance?: { state?: string } };
            return {
                connected: data?.instance?.state === 'open',
                instance: instanceName,
            };
        } catch {
            return { connected: false, instance: instanceName };
        }
    },
};