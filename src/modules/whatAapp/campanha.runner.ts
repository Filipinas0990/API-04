import { whatsappRepository } from './whatsapp.repository';
import { evolutionService } from './evolution.service';

interface CampanhaJob {
    cancelled: boolean;
}

// Registry de campanhas ativas (em memória)
const activeCampaigns = new Map<string, CampanhaJob>();

function toInstanceName(userId: string): string {
    return `inst-${userId.split('-')[0]}`;
}

// ±25% de jitter para parecer comportamento humano e evitar ban
function randomDelay(baseMs: number): number {
    const jitter = baseMs * 0.25;
    return Math.round(baseMs + Math.random() * jitter * 2 - jitter);
}

// Sleep interrompível: checa cancelamento a cada 500ms
async function sleepCancellable(ms: number, job: CampanhaJob): Promise<void> {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline && !job.cancelled) {
        await new Promise(r => setTimeout(r, Math.min(500, deadline - Date.now())));
    }
}

export interface LeadDaCampanha {
    id: string;
    name: string;
    telefone: string;
    interesse?: string | null;
}

export interface OpcoesCampanha {
    disparoId: string;
    userId: string;
    leads: LeadDaCampanha[];
    mensagem: string;
    intervaloMs: number;
}

export const campanhaRunner = {
    // Inicia a campanha em background sem bloquear a resposta HTTP
    iniciar(opts: OpcoesCampanha): void {
        const job: CampanhaJob = { cancelled: false };
        activeCampaigns.set(opts.disparoId, job);

        const inst = toInstanceName(opts.userId);

        (async () => {
            let enviados = 0;
            let falhas = 0;

            try {
                for (let i = 0; i < opts.leads.length; i++) {
                    if (job.cancelled) break;

                    const lead = opts.leads[i];

                    try {
                        const msg = opts.mensagem
                            .replace(/\{nome\}/g, lead.name)
                            .replace(/\{interesse\}/g, lead.interesse ?? '');

                        const ok = await evolutionService.sendText(inst, lead.telefone, msg);

                        if (ok) {
                            enviados++;
                            const conversa = await whatsappRepository.findOrCreateConversa(
                                opts.userId, lead.telefone, lead.name,
                            );
                            await whatsappRepository.saveMensagem({
                                user_id: opts.userId,
                                conversa_id: conversa.id,
                                telefone: lead.telefone,
                                direcao: 'enviada',
                                conteudo: msg,
                            });
                            await whatsappRepository.saveDisparoLog({
                                user_id: opts.userId,
                                lead_id: lead.id,
                                lead_name: lead.name,
                                phone: lead.telefone,
                                success: true,
                                message_preview: msg.slice(0, 100),
                            });
                        } else {
                            falhas++;
                            await whatsappRepository.saveDisparoLog({
                                user_id: opts.userId,
                                lead_id: lead.id,
                                lead_name: lead.name,
                                phone: lead.telefone,
                                success: false,
                                message_preview: msg.slice(0, 100),
                            });
                        }
                    } catch {
                        falhas++;
                    }

                    // Persiste progresso para o frontend poder fazer polling
                    await whatsappRepository.updateDisparo(opts.disparoId, opts.userId, {
                        enviados,
                        falhas,
                    });

                    // Aguarda antes da próxima mensagem (exceto após a última)
                    if (i < opts.leads.length - 1 && !job.cancelled) {
                        const delay = randomDelay(opts.intervaloMs);
                        await sleepCancellable(delay, job);
                    }
                }
            } finally {
                activeCampaigns.delete(opts.disparoId);
                const status = job.cancelled ? 'cancelado' : 'concluido';
                await whatsappRepository.incrementarLimiteDiario(opts.userId, enviados);
                await whatsappRepository.updateDisparo(opts.disparoId, opts.userId, {
                    enviados,
                    falhas,
                    status,
                });
            }
        })().catch(err => {
            console.error(`[campanha] Erro fatal na campanha ${opts.disparoId}:`, err);
            activeCampaigns.delete(opts.disparoId);
            whatsappRepository
                .updateDisparo(opts.disparoId, opts.userId, { status: 'erro' })
                .catch(console.error);
        });
    },

    cancelar(disparoId: string): boolean {
        const job = activeCampaigns.get(disparoId);
        if (!job) return false;
        job.cancelled = true;
        return true;
    },

    estaRodando(disparoId: string): boolean {
        return activeCampaigns.has(disparoId);
    },
};
