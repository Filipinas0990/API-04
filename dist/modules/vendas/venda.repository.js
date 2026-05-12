"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendaRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../database/client");
const venda_db_schema_1 = require("./venda.db.schema");
exports.vendaRepository = {
    async findAll(userId, filters) {
        const all = await client_1.db
            .select()
            .from(venda_db_schema_1.vendas)
            .where((0, drizzle_orm_1.eq)(venda_db_schema_1.vendas.user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(venda_db_schema_1.vendas.created_at));
        let result = all;
        if (filters?.status)
            result = result.filter(v => v.status === filters.status);
        if (filters?.tipo)
            result = result.filter(v => v.tipo === filters.tipo);
        return result;
    },
    async findById(id, userId) {
        const result = await client_1.db
            .select()
            .from(venda_db_schema_1.vendas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(venda_db_schema_1.vendas.id, id), (0, drizzle_orm_1.eq)(venda_db_schema_1.vendas.user_id, userId)));
        return result[0] ?? null;
    },
    async create(userId, data) {
        const [venda] = await client_1.db
            .insert(venda_db_schema_1.vendas)
            .values({ ...data, user_id: userId })
            .returning();
        return venda;
    },
    async update(id, userId, data) {
        const [venda] = await client_1.db
            .update(venda_db_schema_1.vendas)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(venda_db_schema_1.vendas.id, id), (0, drizzle_orm_1.eq)(venda_db_schema_1.vendas.user_id, userId)))
            .returning();
        return venda ?? null;
    },
    async delete(id, userId) {
        const [venda] = await client_1.db
            .delete(venda_db_schema_1.vendas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(venda_db_schema_1.vendas.id, id), (0, drizzle_orm_1.eq)(venda_db_schema_1.vendas.user_id, userId)))
            .returning();
        return venda ?? null;
    },
    // Resumo financeiro: total de vendas concluídas
    async getResumo(userId) {
        const todas = await client_1.db
            .select()
            .from(venda_db_schema_1.vendas)
            .where((0, drizzle_orm_1.eq)(venda_db_schema_1.vendas.user_id, userId));
        const concluidas = todas.filter(v => v.status === 'Concluída');
        const totalVendas = concluidas.reduce((sum, v) => sum + Number(v.valor), 0);
        const totalComissao = concluidas.reduce((sum, v) => {
            const comissao = (Number(v.valor) * Number(v.base_calculo_pct)) / 100;
            const imposto = (comissao * Number(v.percentual_imposto)) / 100;
            return sum + comissao - imposto;
        }, 0);
        return {
            total_vendas: todas.length,
            vendas_concluidas: concluidas.length,
            valor_total: totalVendas,
            comissao_total: totalComissao,
            por_status: {
                em_negociacao: todas.filter(v => v.status === 'Em negociação').length,
                proposta_enviada: todas.filter(v => v.status === 'Proposta enviada').length,
                contrato_assinado: todas.filter(v => v.status === 'Contrato assinado').length,
                concluida: concluidas.length,
                cancelada: todas.filter(v => v.status === 'Cancelada').length,
            }
        };
    },
};
//# sourceMappingURL=venda.repository.js.map