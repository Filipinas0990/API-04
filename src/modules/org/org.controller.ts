import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'node:crypto';
import { z } from 'zod';
import { orgRepository } from './org.repository';
import { authRepository } from '../auth/auth.repository';
import { signAccessToken } from '../../config/jwt';

const updateOrgSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    logo_url: z.string().url().optional(),
});

const inviteSchema = z.object({
    email: z.string().email('Email inválido'),
});

export const orgController = {

    // ── GET /org/me ───────────────────────────────────────────────────────────
    async getOrgMe(req: FastifyRequest, reply: FastifyReply) {
        const org = await orgRepository.findOrgById(req.user.organization_id!);
        if (!org) return reply.status(404).send({ message: 'Organização não encontrada' });
        return reply.send(org);
    },

    // ── PATCH /org/me ─────────────────────────────────────────────────────────
    async updateOrgMe(req: FastifyRequest, reply: FastifyReply) {
        const data = updateOrgSchema.parse(req.body);
        const org = await orgRepository.updateOrg(req.user.organization_id!, data);
        if (!org) return reply.status(404).send({ message: 'Organização não encontrada' });
        return reply.send(org);
    },

    // ── GET /org/members ──────────────────────────────────────────────────────
    async listMembers(req: FastifyRequest, reply: FastifyReply) {
        const members = await orgRepository.listMembers(req.user.organization_id!);
        return reply.send(members);
    },

    // ── DELETE /org/members/:userId ───────────────────────────────────────────
    async removeMember(req: FastifyRequest, reply: FastifyReply) {
        const { userId } = req.params as { userId: string };

        if (userId === req.user.id) {
            return reply.status(400).send({ message: 'Você não pode remover a si mesmo' });
        }

        const removed = await orgRepository.removeMember(userId, req.user.organization_id!);
        if (!removed) return reply.status(404).send({ message: 'Corretor não encontrado nesta organização' });
        return reply.status(204).send();
    },

    // ── POST /org/invites ─────────────────────────────────────────────────────
    async createInvite(req: FastifyRequest, reply: FastifyReply) {
        const { email } = inviteSchema.parse(req.body);

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

        const invite = await orgRepository.createInvite({
            organization_id: req.user.organization_id!,
            email,
            token,
            expires_at: expiresAt,
        });

        // O link de aceitação deve ser montado pelo frontend com o token
        return reply.status(201).send({ ...invite, token });
    },

    // ── GET /org/invites ──────────────────────────────────────────────────────
    async listInvites(req: FastifyRequest, reply: FastifyReply) {
        const list = await orgRepository.listInvites(req.user.organization_id!);
        return reply.send(list);
    },

    // ── DELETE /org/invites/:id ───────────────────────────────────────────────
    async cancelInvite(req: FastifyRequest, reply: FastifyReply) {
        const { id } = req.params as { id: string };
        const invite = await orgRepository.updateInviteStatus(id, 'cancelado');
        if (!invite) return reply.status(404).send({ message: 'Convite não encontrado' });
        return reply.status(204).send();
    },

    // ── GET /org/invites/:token (público) ─────────────────────────────────────
    async getInviteByToken(req: FastifyRequest, reply: FastifyReply) {
        const { token } = req.params as { token: string };
        const invite = await orgRepository.findInviteByToken(token);

        if (!invite) return reply.status(404).send({ message: 'Convite não encontrado' });
        if (invite.status !== 'pendente') return reply.status(410).send({ message: 'Este convite já foi usado ou cancelado' });
        if (new Date(invite.expires_at) < new Date()) return reply.status(410).send({ message: 'Convite expirado' });

        const org = await orgRepository.findOrgById(invite.organization_id);
        return reply.send({ email: invite.email, organization: org, expires_at: invite.expires_at });
    },

    // ── GET /org/dashboard ───────────────────────────────────────────────────
    async getTeamDashboard(req: FastifyRequest, reply: FastifyReply) {
        const data = await orgRepository.getTeamDashboard(req.user.organization_id!);
        return reply.send(data);
    },

    // ── GET /org/pipeline ────────────────────────────────────────────────────
    async getOrgPipeline(req: FastifyRequest, reply: FastifyReply) {
        const pipeline = await orgRepository.getOrgPipeline(req.user.organization_id!);
        return reply.send(pipeline);
    },

    // ── GET /org/equipe/leads ────────────────────────────────────────────────
    async listOrgLeads(req: FastifyRequest, reply: FastifyReply) {
        const data = await orgRepository.listOrgLeads(req.user.organization_id!);
        return reply.send(data);
    },

    // ── GET /org/equipe/vendas ───────────────────────────────────────────────
    async listOrgVendas(req: FastifyRequest, reply: FastifyReply) {
        const data = await orgRepository.listOrgVendas(req.user.organization_id!);
        return reply.send(data);
    },

    // ── POST /org/invites/:token/accept (autenticado) ─────────────────────────
    async acceptInvite(req: FastifyRequest, reply: FastifyReply) {
        const { token } = req.params as { token: string };

        if (req.user.tipo_conta !== 'corretor') {
            return reply.status(400).send({ message: 'Apenas corretores podem aceitar convites' });
        }
        if (req.user.organization_id) {
            return reply.status(400).send({ message: 'Você já pertence a uma imobiliária' });
        }

        const invite = await orgRepository.findInviteByToken(token);
        if (!invite) return reply.status(404).send({ message: 'Convite não encontrado' });
        if (invite.status !== 'pendente') return reply.status(410).send({ message: 'Este convite já foi usado ou cancelado' });
        if (new Date(invite.expires_at) < new Date()) return reply.status(410).send({ message: 'Convite expirado' });

        // Vincula o corretor à org e marca o convite como aceito
        await authRepository.update(req.user.id, { organization_id: invite.organization_id, role: 'agent' });
        await orgRepository.updateInviteStatus(invite.id, 'aceito');

        // Emite novo access token já com organization_id atualizado
        const newAccessToken = signAccessToken(req.user.id, {
            role: 'agent',
            tipo_conta: 'corretor',
            organization_id: invite.organization_id,
        });

        return reply.send({ access_token: newAccessToken, organization_id: invite.organization_id });
    },
};
