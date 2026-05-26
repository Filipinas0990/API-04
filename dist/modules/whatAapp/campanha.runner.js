"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campanhaRunner = void 0;
const whatsapp_repository_1 = require("./whatsapp.repository");
const evolution_service_1 = require("./evolution.service");
const activeCampaigns = new Map();
function toInstanceName(userId) {
    return `inst-${userId.split('-')[0]}`;
}
// ±25% de jitter para parecer comportamento humano e evitar ban
function randomDelay(baseMs) {
    const jitter = baseMs * 0.25;
    return Math.round(baseMs + Math.random() * jitter * 2 - jitter);
}
// Sleep interrompível: checa cancelamento a cada 500ms
async function sleepCancellable(ms, job) {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline && !job.cancelled) {
        await new Promise(r => setTimeout(r, Math.min(500, deadline - Date.now())));
    }
}
async function enviarEtapa(inst, telefone, etapa, lead) {
    const substituir = (texto) => texto
        .replace(/\{nome\}/g, lead.name)
        .replace(/\{interesse\}/g, lead.interesse ?? '');
    if (etapa.tipo === 'texto') {
        return evolution_service_1.evolutionService.sendText(inst, telefone, substituir(etapa.conteudo));
    }
    return evolution_service_1.evolutionService.sendMedia(inst, telefone, etapa.tipo, etapa.conteudo, '');
}
exports.campanhaRunner = {
    iniciar(opts) {
        const job = { cancelled: false };
        activeCampaigns.set(opts.disparoId, job);
        const inst = toInstanceName(opts.userId);
        // Normaliza: se não tem funil, cria uma etapa de texto com a mensagem simples
        const etapas = opts.etapas?.length
            ? opts.etapas
            : [{ tipo: 'texto', conteudo: opts.mensagem, intervalo_antes: 0 }];
        (async () => {
            let enviados = 0;
            let falhas = 0;
            try {
                for (let i = 0; i < opts.leads.length; i++) {
                    if (job.cancelled)
                        break;
                    const lead = opts.leads[i];
                    let leadOk = true;
                    // Envia cada etapa do funil em sequência para este lead
                    for (const etapa of etapas) {
                        if (job.cancelled)
                            break;
                        // Aguarda o intervalo_antes desta etapa (se > 0)
                        if (etapa.intervalo_antes > 0) {
                            await sleepCancellable(etapa.intervalo_antes * 1000, job);
                        }
                        if (job.cancelled)
                            break;
                        try {
                            const ok = await enviarEtapa(inst, lead.telefone, etapa, lead);
                            if (!ok) {
                                leadOk = false;
                            }
                        }
                        catch {
                            leadOk = false;
                        }
                    }
                    if (leadOk) {
                        enviados++;
                        try {
                            const conversa = await whatsapp_repository_1.whatsappRepository.findOrCreateConversa(opts.userId, lead.telefone, lead.name);
                            const preview = etapas[0]?.conteudo?.slice(0, 100) ?? '';
                            if (conversa?.id) {
                                await whatsapp_repository_1.whatsappRepository.saveMensagem({
                                    user_id: opts.userId,
                                    conversa_id: conversa.id,
                                    telefone: lead.telefone,
                                    direcao: 'enviada',
                                    conteudo: preview || ' ',
                                });
                            }
                            await whatsapp_repository_1.whatsappRepository.saveDisparoLog({
                                user_id: opts.userId,
                                lead_id: lead.id,
                                lead_name: lead.name,
                                phone: lead.telefone,
                                success: true,
                                message_preview: preview,
                            });
                        }
                        catch (dbErr) {
                            console.error(`[campanha] Erro ao salvar log do lead ${lead.id}:`, dbErr);
                        }
                    }
                    else {
                        falhas++;
                        try {
                            await whatsapp_repository_1.whatsappRepository.saveDisparoLog({
                                user_id: opts.userId,
                                lead_id: lead.id,
                                lead_name: lead.name,
                                phone: lead.telefone,
                                success: false,
                                message_preview: etapas[0]?.conteudo?.slice(0, 100) ?? '',
                            });
                        }
                        catch (dbErr) {
                            console.error(`[campanha] Erro ao salvar log de falha do lead ${lead.id}:`, dbErr);
                        }
                    }
                    // Persiste progresso para polling do frontend
                    try {
                        await whatsapp_repository_1.whatsappRepository.updateDisparo(opts.disparoId, opts.userId, {
                            enviados,
                            falhas,
                        });
                    }
                    catch (dbErr) {
                        console.error(`[campanha] Erro ao atualizar progresso:`, dbErr);
                    }
                    // Aguarda intervalo entre leads (exceto após o último)
                    if (i < opts.leads.length - 1 && !job.cancelled) {
                        const delay = randomDelay(opts.intervaloMs);
                        await sleepCancellable(delay, job);
                    }
                }
            }
            finally {
                activeCampaigns.delete(opts.disparoId);
                const status = job.cancelled ? 'cancelado' : 'concluido';
                try {
                    await whatsapp_repository_1.whatsappRepository.incrementarLimiteDiario(opts.userId, enviados);
                }
                catch (dbErr) {
                    console.error(`[campanha] Erro ao incrementar limite diário:`, dbErr);
                }
                try {
                    await whatsapp_repository_1.whatsappRepository.updateDisparo(opts.disparoId, opts.userId, {
                        enviados,
                        falhas,
                        status,
                    });
                }
                catch (dbErr) {
                    console.error(`[campanha] Erro ao finalizar campanha no DB:`, dbErr);
                }
            }
        })().catch(err => {
            console.error(`[campanha] Erro fatal na campanha ${opts.disparoId}:`, err);
            activeCampaigns.delete(opts.disparoId);
            whatsapp_repository_1.whatsappRepository
                .updateDisparo(opts.disparoId, opts.userId, { status: 'erro' })
                .catch(console.error);
        });
    },
    cancelar(disparoId) {
        const job = activeCampaigns.get(disparoId);
        if (!job)
            return false;
        job.cancelled = true;
        return true;
    },
    estaRodando(disparoId) {
        return activeCampaigns.has(disparoId);
    },
};
//# sourceMappingURL=campanha.runner.js.map