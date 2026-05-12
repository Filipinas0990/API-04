"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fluxoRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../database/client");
const fluxo_db_schema_1 = require("./fluxo.db.schema");
exports.fluxoRepository = {
    async findAll(userId, filters) {
        const all = await client_1.db
            .select()
            .from(fluxo_db_schema_1.fluxoCaixa)
            .where((0, drizzle_orm_1.eq)(fluxo_db_schema_1.fluxoCaixa.user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(fluxo_db_schema_1.fluxoCaixa.data));
        let result = all;
        if (filters?.tipo)
            result = result.filter(f => f.tipo === filters.tipo);
        if (filters?.status)
            result = result.filter(f => f.status === filters.status);
        if (filters?.categoria)
            result = result.filter(f => f.categoria === filters.categoria);
        return result;
    },
    async findById(id, userId) {
        const result = await client_1.db
            .select()
            .from(fluxo_db_schema_1.fluxoCaixa)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(fluxo_db_schema_1.fluxoCaixa.id, id), (0, drizzle_orm_1.eq)(fluxo_db_schema_1.fluxoCaixa.user_id, userId)));
        return result[0] ?? null;
    },
    async create(userId, data) {
        const [fluxo] = await client_1.db
            .insert(fluxo_db_schema_1.fluxoCaixa)
            .values({ ...data, user_id: userId })
            .returning();
        return fluxo;
    },
    async update(id, userId, data) {
        const [fluxo] = await client_1.db
            .update(fluxo_db_schema_1.fluxoCaixa)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(fluxo_db_schema_1.fluxoCaixa.id, id), (0, drizzle_orm_1.eq)(fluxo_db_schema_1.fluxoCaixa.user_id, userId)))
            .returning();
        return fluxo ?? null;
    },
    async delete(id, userId) {
        const [fluxo] = await client_1.db
            .delete(fluxo_db_schema_1.fluxoCaixa)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(fluxo_db_schema_1.fluxoCaixa.id, id), (0, drizzle_orm_1.eq)(fluxo_db_schema_1.fluxoCaixa.user_id, userId)))
            .returning();
        return fluxo ?? null;
    },
    async getSaldo(userId) {
        const all = await client_1.db
            .select()
            .from(fluxo_db_schema_1.fluxoCaixa)
            .where((0, drizzle_orm_1.eq)(fluxo_db_schema_1.fluxoCaixa.user_id, userId));
        const entradas = all
            .filter(f => f.tipo === 'entrada' && f.status === 'confirmado')
            .reduce((sum, f) => sum + Number(f.valor), 0);
        const saidas = all
            .filter(f => (f.tipo === 'saida' || f.tipo === 'financeiro') && f.status === 'confirmado')
            .reduce((sum, f) => sum + Number(f.valor), 0);
        return {
            entradas,
            saidas,
            saldo: entradas - saidas,
            total_lancamentos: all.length,
        };
    },
};
//# sourceMappingURL=fluxo.repository.js.map