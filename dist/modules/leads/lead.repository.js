"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../database/client");
const lead_db_schema_1 = require("./lead.db.schema");
exports.leadRepository = {
    // Listar todos os leads do usuário (com filtros opcionais)
    async findAll(userId, filters) {
        const conditions = [(0, drizzle_orm_1.eq)(lead_db_schema_1.leads.user_id, userId)];
        if (filters?.status) {
            conditions.push((0, drizzle_orm_1.eq)(lead_db_schema_1.leads.status, filters.status));
        }
        const allLeads = await client_1.db
            .select()
            .from(lead_db_schema_1.leads)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy(lead_db_schema_1.leads.created_at);
        // Filtro de busca em memória (nome ou telefone)
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            return allLeads.filter(l => l.name.toLowerCase().includes(search) ||
                l.telefone.includes(search) ||
                (l.email?.toLowerCase().includes(search) ?? false));
        }
        return allLeads;
    },
    // Buscar lead por ID (garante que pertence ao usuário)
    async findById(id, userId) {
        const result = await client_1.db
            .select()
            .from(lead_db_schema_1.leads)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(lead_db_schema_1.leads.id, id), (0, drizzle_orm_1.eq)(lead_db_schema_1.leads.user_id, userId)));
        return result[0] ?? null;
    },
    // Criar lead
    async create(userId, data) {
        const [lead] = await client_1.db
            .insert(lead_db_schema_1.leads)
            .values({ ...data, user_id: userId })
            .returning();
        return lead;
    },
    // Atualizar lead
    async update(id, userId, data) {
        const [lead] = await client_1.db
            .update(lead_db_schema_1.leads)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(lead_db_schema_1.leads.id, id), (0, drizzle_orm_1.eq)(lead_db_schema_1.leads.user_id, userId)))
            .returning();
        return lead ?? null;
    },
    // Deletar lead
    async delete(id, userId) {
        const [lead] = await client_1.db
            .delete(lead_db_schema_1.leads)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(lead_db_schema_1.leads.id, id), (0, drizzle_orm_1.eq)(lead_db_schema_1.leads.user_id, userId)))
            .returning();
        return lead ?? null;
    },
    // Pipeline: leads agrupados por status
    async getPipeline(userId) {
        const allLeads = await client_1.db
            .select()
            .from(lead_db_schema_1.leads)
            .where((0, drizzle_orm_1.eq)(lead_db_schema_1.leads.user_id, userId))
            .orderBy(lead_db_schema_1.leads.created_at);
        return {
            novo_cliente: allLeads.filter(l => l.status === 'novo_cliente'),
            em_contato: allLeads.filter(l => l.status === 'em_contato'),
            visita_marcada: allLeads.filter(l => l.status === 'visita_marcada'),
            proposta_enviada: allLeads.filter(l => l.status === 'proposta_enviada'),
            cliente_desistiu: allLeads.filter(l => l.status === 'cliente_desistiu'),
        };
    },
};
//# sourceMappingURL=lead.repository.js.map