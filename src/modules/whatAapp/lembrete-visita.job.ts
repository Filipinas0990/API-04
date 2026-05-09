import cron from 'node-cron';
import { visitaRepository } from '../visitas/visita.repository';
import { tarefaRepository } from '../tarefas/tarefa.repository';
import { evolutionService } from './evolution.service';

export function iniciarJobLembretes() {

    // JOB 1 — Envia lembrete 24h antes da visita (roda a cada hora cheia)
    cron.schedule('0 * * * *', async () => {
        try {
            const visitas = await visitaRepository.findVisitasParaLembrete();
            for (const v of visitas) {
                if (!v.telefone_cliente) continue;

                const dataFormatada = new Date(v.data).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    dateStyle: 'short',
                    timeStyle: 'short',
                });

                await evolutionService.sendText(
                    v.telefone_cliente,
                    `Olá ${v.nome_cliente ?? 'tudo bem'}! 👋\n\n` +
                    `Lembrando que você tem uma visita agendada para *${dataFormatada}*.\n\n` +
                    `Você confirma sua presença?\n*1 - Sim, confirmo ✅*\n*2 - Não poderei ir ❌*`,
                );

                await visitaRepository.marcarLembreteEnviado(v.id);
            }
        } catch (err) {
            console.error('[lembrete-job] Erro ao enviar lembretes:', err);
        }
    });

    // JOB 2 — Cria tarefa para visitas sem confirmação após 12h (roda nos :30 de cada hora)
    cron.schedule('30 * * * *', async () => {
        try {
            const visitas = await visitaRepository.findNaoConfirmadasSemTarefa();
            for (const v of visitas) {
                const nome = v.nome_cliente ?? v.telefone_cliente ?? 'cliente';
                const dataFormatada = new Date(v.data).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    dateStyle: 'short',
                    timeStyle: 'short',
                });

                await tarefaRepository.create(v.user_id, {
                    titulo: `Ligar para ${nome} — visita não confirmada`,
                    descricao: `Cliente não respondeu o lembrete da visita agendada para ${dataFormatada}. Ligar e verificar presença.`,
                    data_fim: new Date(),
                    prioridade: 'alta',
                    lead_id: v.lead_id ?? null,
                });

                await visitaRepository.marcarTarefaLembreteCriada(v.id);
            }
        } catch (err) {
            console.error('[lembrete-job] Erro ao criar tarefas:', err);
        }
    });

    console.log('✅ Jobs de lembrete de visitas iniciados');
}
