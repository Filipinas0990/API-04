import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '../config/env';

async function ensureEtiquetasTables(client: postgres.Sql) {
    await client.unsafe(`
        CREATE TABLE IF NOT EXISTS "etiquetas" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "name" text NOT NULL,
            "color" text NOT NULL DEFAULT '#6366f1',
            "icon" text NOT NULL DEFAULT 'tag',
            "keyword_trigger" text,
            "keyword_type" text NOT NULL DEFAULT 'contains',
            "created_at" timestamp DEFAULT now(),
            "updated_at" timestamp DEFAULT now()
        )
    `);
    await client.unsafe(`
        CREATE TABLE IF NOT EXISTS "lead_etiquetas" (
            "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
            "etiqueta_id" uuid NOT NULL REFERENCES "etiquetas"("id") ON DELETE CASCADE,
            "created_at" timestamp DEFAULT now(),
            CONSTRAINT "lead_etiquetas_pk" PRIMARY KEY ("lead_id", "etiqueta_id")
        )
    `);
    console.log('[migrate] Tabelas etiquetas e lead_etiquetas garantidas.');
}

export async function runMigrations() {
    const client = postgres(env.DATABASE_URL, { max: 1 });
    const db = drizzle(client);

    console.log('[migrate] Verificando migrations pendentes...');
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('[migrate] Banco de dados atualizado.');

    await ensureEtiquetasTables(client);

    await client.end();
}
