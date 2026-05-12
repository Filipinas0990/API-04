"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imovelRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../database/client");
const imovel_db_schema_1 = require("./imovel.db.schema");
exports.imovelRepository = {
    async findAll(userId, filters) {
        const all = await client_1.db
            .select()
            .from(imovel_db_schema_1.imoveis)
            .where((0, drizzle_orm_1.eq)(imovel_db_schema_1.imoveis.user_id, userId))
            .orderBy(imovel_db_schema_1.imoveis.created_at);
        let result = all;
        if (filters?.tipo)
            result = result.filter(i => i.tipo === filters.tipo);
        if (filters?.status)
            result = result.filter(i => i.status === filters.status);
        if (filters?.cidade)
            result = result.filter(i => i.cidade?.toLowerCase().includes(filters.cidade.toLowerCase()));
        if (filters?.preco_min)
            result = result.filter(i => Number(i.preco) >= filters.preco_min);
        if (filters?.preco_max)
            result = result.filter(i => Number(i.preco) <= filters.preco_max);
        if (filters?.search) {
            const s = filters.search.toLowerCase();
            result = result.filter(i => i.titulo.toLowerCase().includes(s) ||
                i.bairro?.toLowerCase().includes(s) ||
                i.cidade?.toLowerCase().includes(s) ||
                i.endereco?.toLowerCase().includes(s));
        }
        return result;
    },
    async findById(id, userId) {
        const result = await client_1.db
            .select()
            .from(imovel_db_schema_1.imoveis)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(imovel_db_schema_1.imoveis.id, id), (0, drizzle_orm_1.eq)(imovel_db_schema_1.imoveis.user_id, userId)));
        return result[0] ?? null;
    },
    async create(userId, data) {
        const [imovel] = await client_1.db
            .insert(imovel_db_schema_1.imoveis)
            .values({ ...data, user_id: userId })
            .returning();
        return imovel;
    },
    async update(id, userId, data) {
        const [imovel] = await client_1.db
            .update(imovel_db_schema_1.imoveis)
            .set({ ...data, updated_at: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(imovel_db_schema_1.imoveis.id, id), (0, drizzle_orm_1.eq)(imovel_db_schema_1.imoveis.user_id, userId)))
            .returning();
        return imovel ?? null;
    },
    async delete(id, userId) {
        const [imovel] = await client_1.db
            .delete(imovel_db_schema_1.imoveis)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(imovel_db_schema_1.imoveis.id, id), (0, drizzle_orm_1.eq)(imovel_db_schema_1.imoveis.user_id, userId)))
            .returning();
        return imovel ?? null;
    },
};
//# sourceMappingURL=imovel.repository.js.map