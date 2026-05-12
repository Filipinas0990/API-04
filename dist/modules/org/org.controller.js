"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgController = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const zod_1 = require("zod");
const org_repository_1 = require("./org.repository");
const auth_repository_1 = require("../auth/auth.repository");
const jwt_1 = require("../../config/jwt");
const updateOrgSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    logo_url: zod_1.z.string().url().optional(),
});
const inviteSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
});
exports.orgController = {
    // ── GET /org/me ───────────────────────────────────────────────────────────
    async getOrgMe(req, reply) {
        const org = await org_repository_1.orgRepository.findOrgById(req.user.organization_id);
        if (!org)
            return reply.status(404).send({ message: 'Organização não encontrada' });
        return reply.send(org);
    },
    // ── PATCH /org/me ─────────────────────────────────────────────────────────
    async updateOrgMe(req, reply) {
        const data = updateOrgSchema.parse(req.body);
        const org = await org_repository_1.orgRepository.updateOrg(req.user.organization_id, data);
        if (!org)
            return reply.status(404).send({ message: 'Organização não encontrada' });
        return reply.send(org);
    },
    // ── GET /org/members ──────────────────────────────────────────────────────
    async listMembers(req, reply) {
        const members = await org_repository_1.orgRepository.listMembers(req.user.organization_id);
        return reply.send(members);
    },
    // ── DELETE /org/members/:userId ───────────────────────────────────────────
    async removeMember(req, reply) {
        const { userId } = req.params;
        if (userId === req.user.id) {
            return reply.status(400).send({ message: 'Você não pode remover a si mesmo' });
        }
        const removed = await org_repository_1.orgRepository.removeMember(userId, req.user.organization_id);
        if (!removed)
            return reply.status(404).send({ message: 'Corretor não encontrado nesta organização' });
        return reply.status(204).send();
    },
    // ── POST /org/invites ─────────────────────────────────────────────────────
    async createInvite(req, reply) {
        const { email } = inviteSchema.parse(req.body);
        const token = node_crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
        const invite = await org_repository_1.orgRepository.createInvite({
            organization_id: req.user.organization_id,
            email,
            token,
            expires_at: expiresAt,
        });
        // O link de aceitação deve ser montado pelo frontend com o token
        return reply.status(201).send({ ...invite, token });
    },
    // ── GET /org/invites ──────────────────────────────────────────────────────
    async listInvites(req, reply) {
        const list = await org_repository_1.orgRepository.listInvites(req.user.organization_id);
        return reply.send(list);
    },
    // ── DELETE /org/invites/:id ───────────────────────────────────────────────
    async cancelInvite(req, reply) {
        const { id } = req.params;
        const invite = await org_repository_1.orgRepository.updateInviteStatus(id, 'cancelado');
        if (!invite)
            return reply.status(404).send({ message: 'Convite não encontrado' });
        return reply.status(204).send();
    },
    // ── GET /org/invites/:token (público) ─────────────────────────────────────
    async getInviteByToken(req, reply) {
        const { token } = req.params;
        const invite = await org_repository_1.orgRepository.findInviteByToken(token);
        if (!invite)
            return reply.status(404).send({ message: 'Convite não encontrado' });
        if (invite.status !== 'pendente')
            return reply.status(410).send({ message: 'Este convite já foi usado ou cancelado' });
        if (new Date(invite.expires_at) < new Date())
            return reply.status(410).send({ message: 'Convite expirado' });
        const org = await org_repository_1.orgRepository.findOrgById(invite.organization_id);
        return reply.send({ email: invite.email, organization: org, expires_at: invite.expires_at });
    },
    // ── GET /org/dashboard ───────────────────────────────────────────────────
    async getTeamDashboard(req, reply) {
        const data = await org_repository_1.orgRepository.getTeamDashboard(req.user.organization_id);
        return reply.send(data);
    },
    // ── GET /org/pipeline ────────────────────────────────────────────────────
    async getOrgPipeline(req, reply) {
        const pipeline = await org_repository_1.orgRepository.getOrgPipeline(req.user.organization_id);
        return reply.send(pipeline);
    },
    // ── GET /org/equipe/leads ────────────────────────────────────────────────
    async listOrgLeads(req, reply) {
        const data = await org_repository_1.orgRepository.listOrgLeads(req.user.organization_id);
        return reply.send(data);
    },
    // ── GET /org/equipe/vendas ───────────────────────────────────────────────
    async listOrgVendas(req, reply) {
        const data = await org_repository_1.orgRepository.listOrgVendas(req.user.organization_id);
        return reply.send(data);
    },
    // ── POST /org/invites/:token/accept (autenticado) ─────────────────────────
    async acceptInvite(req, reply) {
        const { token } = req.params;
        if (req.user.tipo_conta !== 'corretor') {
            return reply.status(400).send({ message: 'Apenas corretores podem aceitar convites' });
        }
        if (req.user.organization_id) {
            return reply.status(400).send({ message: 'Você já pertence a uma imobiliária' });
        }
        const invite = await org_repository_1.orgRepository.findInviteByToken(token);
        if (!invite)
            return reply.status(404).send({ message: 'Convite não encontrado' });
        if (invite.status !== 'pendente')
            return reply.status(410).send({ message: 'Este convite já foi usado ou cancelado' });
        if (new Date(invite.expires_at) < new Date())
            return reply.status(410).send({ message: 'Convite expirado' });
        // Vincula o corretor à org e marca o convite como aceito
        await auth_repository_1.authRepository.update(req.user.id, { organization_id: invite.organization_id, role: 'agent' });
        await org_repository_1.orgRepository.updateInviteStatus(invite.id, 'aceito');
        // Emite novo access token já com organization_id atualizado
        const newAccessToken = (0, jwt_1.signAccessToken)(req.user.id, {
            role: 'agent',
            tipo_conta: 'corretor',
            organization_id: invite.organization_id,
        });
        return reply.send({ access_token: newAccessToken, organization_id: invite.organization_id });
    },
};
//# sourceMappingURL=org.controller.js.map