"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitaRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../../database/client");
const visita_db_schema_1 = require("./visita.db.schema");
exports.visitaRepository = {
    async findAll(userId, filters) {
        const all = await client_1.db
            .select()
            .from(visita_db_schema_1.visitas)
            .where((0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.user_id, userId))
            .orderBy((0, drizzle_orm_1.desc)(visita_db_schema_1.visitas.data));
        let result = all;
        if (filters?.status)
            result = result.filter(v => v.status === filters.status);
        if (filters?.lead_id)
            result = result.filter(v => v.lead_id === filters.lead_id);
        if (filters?.imovel_id)
            result = result.filter(v => v.imovel_id === filters.imovel_id);
        return result;
    },
    async findById(id, userId) {
        const result = await client_1.db
            .select()
            .from(visita_db_schema_1.visitas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.id, id), (0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.user_id, userId)));
        return result[0] ?? null;
    },
    async create(userId, data) {
        const payload = {
            ...data,
            user_id: userId,
            data: data.data ? new Date(data.data) : new Date(),
        };
        const [visita] = await client_1.db
            .insert(visita_db_schema_1.visitas)
            .values(payload)
            .returning();
        return visita;
    },
    async update(id, userId, data) {
        const payload = { ...data, updated_at: new Date() };
        if (data.data)
            payload.data = new Date(data.data);
        const [visita] = await client_1.db
            .update(visita_db_schema_1.visitas)
            .set(payload)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.id, id), (0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.user_id, userId)))
            .returning();
        return visita ?? null;
    },
    async delete(id, userId) {
        const [visita] = await client_1.db
            .delete(visita_db_schema_1.visitas)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.id, id), (0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.user_id, userId)))
            .returning();
        return visita ?? null;
    },
    // ── LEMBRETES AUTOMÁTICOS ────────────────────────────────────────────────
    // Visitas nas próximas 23h–25h com telefone cadastrado e sem lembrete enviado
    async findVisitasParaLembrete() {
        return client_1.db.select().from(visita_db_schema_1.visitas).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${visita_db_schema_1.visitas.data} BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'`, (0, drizzle_orm_1.isNull)(visita_db_schema_1.visitas.lembrete_enviado_at), (0, drizzle_orm_1.isNotNull)(visita_db_schema_1.visitas.telefone_cliente)));
    },
    // Lembrete enviado há +12h, sem confirmação, sem tarefa criada, visita ainda no futuro
    async findNaoConfirmadasSemTarefa() {
        return client_1.db.select().from(visita_db_schema_1.visitas).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${visita_db_schema_1.visitas.lembrete_enviado_at} < NOW() - INTERVAL '12 hours'`, (0, drizzle_orm_1.isNull)(visita_db_schema_1.visitas.confirmada), (0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.tarefa_lembrete_criada, false), (0, drizzle_orm_1.sql) `${visita_db_schema_1.visitas.data} > NOW()`));
    },
    // Visita com lembrete pendente de resposta para um telefone (busca cross-user para o webhook)
    async findPendingLembreteByPhone(telefone) {
        const result = await client_1.db.select().from(visita_db_schema_1.visitas).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.telefone_cliente, telefone), (0, drizzle_orm_1.isNotNull)(visita_db_schema_1.visitas.lembrete_enviado_at), (0, drizzle_orm_1.isNull)(visita_db_schema_1.visitas.confirmada), (0, drizzle_orm_1.sql) `${visita_db_schema_1.visitas.data} > NOW()`)).limit(1);
        return result[0] ?? null;
    },
    async marcarLembreteEnviado(id) {
        await client_1.db.update(visita_db_schema_1.visitas)
            .set({ lembrete_enviado_at: new Date(), updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.id, id));
    },
    async marcarConfirmada(id, confirmada) {
        await client_1.db.update(visita_db_schema_1.visitas)
            .set({ confirmada, lembrete_respondido_at: new Date(), updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.id, id));
    },
    async marcarTarefaLembreteCriada(id) {
        await client_1.db.update(visita_db_schema_1.visitas)
            .set({ tarefa_lembrete_criada: true, updated_at: new Date() })
            .where((0, drizzle_orm_1.eq)(visita_db_schema_1.visitas.id, id));
    },
};
//# sourceMappingURL=visita.repository.js.map