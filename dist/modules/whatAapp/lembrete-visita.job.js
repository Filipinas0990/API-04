"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iniciarJobLembretes = iniciarJobLembretes;
const node_cron_1 = __importDefault(require("node-cron"));
const visita_repository_1 = require("../visitas/visita.repository");
const tarefa_repository_1 = require("../tarefas/tarefa.repository");
const evolution_service_1 = require("./evolution.service");
function iniciarJobLembretes() {
    // JOB 1 — Envia lembrete 24h antes da visita (roda a cada hora cheia)
    node_cron_1.default.schedule('0 * * * *', async () => {
        try {
            const visitas = await visita_repository_1.visitaRepository.findVisitasParaLembrete();
            for (const v of visitas) {
                if (!v.telefone_cliente)
                    continue;
                const dataFormatada = new Date(v.data).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    dateStyle: 'short',
                    timeStyle: 'short',
                });
                await evolution_service_1.evolutionService.sendText(v.telefone_cliente, `Olá ${v.nome_cliente ?? 'tudo bem'}! 👋\n\n` +
                    `Lembrando que você tem uma visita agendada para *${dataFormatada}*.\n\n` +
                    `Você confirma sua presença?\n*1 - Sim, confirmo ✅*\n*2 - Não poderei ir ❌*`);
                await visita_repository_1.visitaRepository.marcarLembreteEnviado(v.id);
            }
        }
        catch (err) {
            console.error('[lembrete-job] Erro ao enviar lembretes:', err);
        }
    });
    // JOB 2 — Cria tarefa para visitas sem confirmação após 12h (roda nos :30 de cada hora)
    node_cron_1.default.schedule('30 * * * *', async () => {
        try {
            const visitas = await visita_repository_1.visitaRepository.findNaoConfirmadasSemTarefa();
            for (const v of visitas) {
                const nome = v.nome_cliente ?? v.telefone_cliente ?? 'cliente';
                const dataFormatada = new Date(v.data).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    dateStyle: 'short',
                    timeStyle: 'short',
                });
                await tarefa_repository_1.tarefaRepository.create(v.user_id, {
                    titulo: `Ligar para ${nome} — visita não confirmada`,
                    descricao: `Cliente não respondeu o lembrete da visita agendada para ${dataFormatada}. Ligar e verificar presença.`,
                    data_fim: new Date(),
                    prioridade: 'alta',
                    lead_id: v.lead_id ?? null,
                });
                await visita_repository_1.visitaRepository.marcarTarefaLembreteCriada(v.id);
            }
        }
        catch (err) {
            console.error('[lembrete-job] Erro ao criar tarefas:', err);
        }
    });
    console.log('✅ Jobs de lembrete de visitas iniciados');
}
//# sourceMappingURL=lembrete-visita.job.js.map