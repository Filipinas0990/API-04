"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const migrator_1 = require("drizzle-orm/postgres-js/migrator");
const postgres_1 = __importDefault(require("postgres"));
const env_1 = require("../config/env");
async function runMigrations() {
    const client = (0, postgres_1.default)(env_1.env.DATABASE_URL, { max: 1 });
    const db = (0, postgres_js_1.drizzle)(client);
    console.log('[migrate] Verificando migrations pendentes...');
    await (0, migrator_1.migrate)(db, { migrationsFolder: 'drizzle' });
    console.log('[migrate] Banco de dados atualizado.');
    await client.end();
}
//# sourceMappingURL=migrate.js.map