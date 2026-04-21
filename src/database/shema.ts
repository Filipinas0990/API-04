import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

import da from 'zod/v4/locales/da.js';

export const leads = pgTable('leads', {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull().unique(),
    gestor_responsalvel: text(),
    temperatura: text(),
    interrese_lead: text(),
    observacao: text(),
    data_criacao: timestamp().defaultNow(),

});