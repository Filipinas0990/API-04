import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '../config/env';

export async function runMigrations() {
    const client = postgres(env.DATABASE_URL, { max: 1 });
    const db = drizzle(client);

    console.log('[migrate] Verificando migrations pendentes...');
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('[migrate] Banco de dados atualizado.');

    await client.end();
}
