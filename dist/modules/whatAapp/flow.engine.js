"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowEngine = void 0;
const whatsapp_repository_1 = require("./whatsapp.repository");
const evolution_service_1 = require("./evolution.service");
const MAX_DELAY_MS = 30_000;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.min(ms, MAX_DELAY_MS)));
}
// Verifica se horário atual (Brasília UTC-3) está no período de folga
function isOffHours(startStr, endStr) {
    const now = new Date();
    const br = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const current = br.getUTCHours() * 60 + br.getUTCMinutes();
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const start = sh * 60 + (sm ?? 0);
    const end = eh * 60 + (em ?? 0);
    // Intervalo que cruza meia-noite (ex: 18:00 → 08:00)
    if (start > end)
        return current >= start || current <= end;
    return current >= start && current <= end;
}
async function shouldTriggerFlow(flow, telefone, conteudo) {
    const trigger = flow.trigger_type ?? 'always';
    if (trigger === 'always')
        return true;
    if (trigger === 'primeira_mensagem' || trigger === 'first_contact') {
        // Dispara apenas se nunca houve sessão concluída com este telefone nesta instância
        const count = await whatsapp_repository_1.whatsappRepository.countFinishedSessions(flow.instance_name, telefone);
        return count === 0;
    }
    if (trigger === 'palavra_chave') {
        // Palavra-chave guardada em node_data do nó start ou diretamente no flow (futuro)
        return true;
    }
    return false;
}
async function executeNode(sessionId, node, userId, instanceName, telefone, conversaId, depth = 0) {
    // Limite de profundidade para evitar loop infinito em flows mal configurados
    if (depth > 30)
        return;
    const type = (node.type ?? '').toLowerCase();
    const delayMs = (node.delay_seconds ?? 0) * 1000;
    // ── START ────────────────────────────────────────────────────────────────
    if (type === 'start') {
        if (node.message) {
            const delayMs = (node.delay_seconds ?? 0) * 1000;
            if (delayMs > 0)
                await sleep(delayMs);
            await evolution_service_1.evolutionService.sendText(telefone, node.message);
            await whatsapp_repository_1.whatsappRepository.saveMensagem({
                user_id: userId, conversa_id: conversaId,
                telefone, direcao: 'enviada', conteudo: node.message,
            });
        }
        if (!node.next_node_id)
            return;
        const next = await whatsapp_repository_1.whatsappRepository.findNodeById(node.next_node_id);
        if (!next)
            return;
        await whatsapp_repository_1.whatsappRepository.updateSession(sessionId, { current_node_id: next.id });
        await executeNode(sessionId, next, userId, instanceName, telefone, conversaId, depth + 1);
        return;
    }
    // ── MESSAGE / MENSAGEM ───────────────────────────────────────────────────
    if (type === 'message' || type === 'mensagem') {
        if (delayMs > 0)
            await sleep(delayMs);
        if (node.message) {
            await evolution_service_1.evolutionService.sendText(telefone, node.message);
            await whatsapp_repository_1.whatsappRepository.saveMensagem({
                user_id: userId, conversa_id: conversaId,
                telefone, direcao: 'enviada', conteudo: node.message,
            });
        }
        if (!node.next_node_id)
            return;
        const next = await whatsapp_repository_1.whatsappRepository.findNodeById(node.next_node_id);
        if (!next)
            return;
        await whatsapp_repository_1.whatsappRepository.updateSession(sessionId, { current_node_id: next.id });
        await executeNode(sessionId, next, userId, instanceName, telefone, conversaId, depth + 1);
        return;
    }
    // ── QUESTION / PERGUNTA ─────────────────────────────────────────────────
    if (type === 'question' || type === 'pergunta') {
        if (delayMs > 0)
            await sleep(delayMs);
        if (node.message) {
            await evolution_service_1.evolutionService.sendText(telefone, node.message);
            await whatsapp_repository_1.whatsappRepository.saveMensagem({
                user_id: userId, conversa_id: conversaId,
                telefone, direcao: 'enviada', conteudo: node.message,
            });
        }
        // Aguarda resposta do usuário
        await whatsapp_repository_1.whatsappRepository.updateSession(sessionId, {
            current_node_id: node.id,
            waiting_for_input: true,
        });
        return;
    }
    // ── MENU ────────────────────────────────────────────────────────────────
    if (type === 'menu') {
        if (delayMs > 0)
            await sleep(delayMs);
        const data = node.node_data;
        const options = data?.options ?? [];
        const optLines = options.map((o, i) => `${i + 1}. ${o.label}`).join('\n');
        const text = node.message ? `${node.message}\n\n${optLines}` : optLines;
        if (text.trim()) {
            await evolution_service_1.evolutionService.sendText(telefone, text);
            await whatsapp_repository_1.whatsappRepository.saveMensagem({
                user_id: userId, conversa_id: conversaId,
                telefone, direcao: 'enviada', conteudo: text,
            });
        }
        await whatsapp_repository_1.whatsappRepository.updateSession(sessionId, {
            current_node_id: node.id,
            waiting_for_input: true,
        });
        return;
    }
    // ── TRANSFERIR ───────────────────────────────────────────────────────────
    if (type === 'transfer' || type === 'transferir') {
        if (delayMs > 0)
            await sleep(delayMs);
        if (node.message) {
            await evolution_service_1.evolutionService.sendText(telefone, node.message);
            await whatsapp_repository_1.whatsappRepository.saveMensagem({
                user_id: userId, conversa_id: conversaId,
                telefone, direcao: 'enviada', conteudo: node.message,
            });
        }
        // Marca conversa para atendimento humano
        await whatsapp_repository_1.whatsappRepository.updateConversaById(conversaId, userId, { status: 'em_atendimento' });
        await whatsapp_repository_1.whatsappRepository.updateSession(sessionId, { status: 'finished' });
        return;
    }
    // ── END / FINALIZAR ──────────────────────────────────────────────────────
    if (type === 'end' || type === 'finalizar') {
        if (delayMs > 0)
            await sleep(delayMs);
        if (node.message) {
            await evolution_service_1.evolutionService.sendText(telefone, node.message);
            await whatsapp_repository_1.whatsappRepository.saveMensagem({
                user_id: userId, conversa_id: conversaId,
                telefone, direcao: 'enviada', conteudo: node.message,
            });
        }
        await whatsapp_repository_1.whatsappRepository.updateSession(sessionId, { status: 'finished' });
        return;
    }
}
async function resumeSession(sessionId, currentNode, conteudo, userId, instanceName, telefone, conversaId) {
    const type = (currentNode.type ?? '').toLowerCase();
    const variables = await whatsapp_repository_1.whatsappRepository.getSessionVariables(sessionId);
    const key = currentNode.label ?? currentNode.id;
    variables[key] = conteudo;
    let nextNodeId = currentNode.next_node_id;
    // Menu: resolve próximo nó pela resposta numerada ou texto
    if (type === 'menu') {
        const data = currentNode.node_data;
        const options = data?.options ?? [];
        const idx = parseInt(conteudo.trim()) - 1;
        if (idx >= 0 && idx < options.length && options[idx].next_node_id) {
            nextNodeId = options[idx].next_node_id ?? null;
        }
        else {
            const match = options.find(o => o.label.toLowerCase() === conteudo.trim().toLowerCase());
            if (match?.next_node_id)
                nextNodeId = match.next_node_id;
        }
    }
    await whatsapp_repository_1.whatsappRepository.updateSession(sessionId, {
        variables,
        waiting_for_input: false,
        current_node_id: nextNodeId ?? null,
    });
    if (!nextNodeId)
        return;
    const nextNode = await whatsapp_repository_1.whatsappRepository.findNodeById(nextNodeId);
    if (!nextNode)
        return;
    await executeNode(sessionId, nextNode, userId, instanceName, telefone, conversaId);
}
exports.flowEngine = {
    async processIncomingMessage(instanceName, telefone, conteudo) {
        // Descobre o user_id pela instance_name registrada nos flows
        const userInfo = await whatsapp_repository_1.whatsappRepository.findUserByInstanceName(instanceName);
        if (!userInfo)
            return;
        const userId = userInfo.user_id;
        // Persiste a mensagem recebida
        const conversa = await whatsapp_repository_1.whatsappRepository.findOrCreateConversa(userId, telefone);
        await whatsapp_repository_1.whatsappRepository.saveMensagem({
            user_id: userId, conversa_id: conversa.id,
            telefone, direcao: 'recebida', conteudo,
        });
        await whatsapp_repository_1.whatsappRepository.updateConversaById(conversa.id, userId, {
            ultima_msg: conteudo,
            ultima_msg_em: new Date(),
        });
        // ── Sessão ativa? ────────────────────────────────────────────────────
        const session = await whatsapp_repository_1.whatsappRepository.findSession(instanceName, telefone);
        if (session?.waiting_for_input && session.current_node_id) {
            const currentNode = await whatsapp_repository_1.whatsappRepository.findNodeById(session.current_node_id);
            if (currentNode) {
                await resumeSession(session.id, currentNode, conteudo, userId, instanceName, telefone, conversa.id);
            }
            return;
        }
        // Sessão ativa mas não aguardando input — ignora
        if (session)
            return;
        // ── Sem sessão: procura flow ativo para disparar ─────────────────────
        const flows = await whatsapp_repository_1.whatsappRepository.findActiveFlowsByInstance(instanceName);
        if (!flows.length)
            return;
        for (const flow of flows) {
            // off_hours: só bloqueia fluxos configurados especificamente para esse trigger
            if (flow.trigger_type === 'off_hours') {
                const offStart = flow.off_hours_start ?? '18:00:00';
                const offEnd = flow.off_hours_end ?? '08:00:00';
                if (!isOffHours(offStart, offEnd))
                    continue;
            }
            const shouldTrigger = await shouldTriggerFlow(flow, telefone, conteudo);
            if (!shouldTrigger)
                continue;
            const startNode = await whatsapp_repository_1.whatsappRepository.findStartNode(flow.id);
            if (!startNode)
                continue;
            const newSession = await whatsapp_repository_1.whatsappRepository.createSession({
                instance_name: instanceName,
                phone: telefone,
                flow_id: flow.id,
                current_node_id: startNode.id,
                status: 'active',
                variables: {},
                waiting_for_input: false,
            });
            await executeNode(newSession.id, startNode, userId, instanceName, telefone, conversa.id);
            break;
        }
    },
};
//# sourceMappingURL=flow.engine.js.map