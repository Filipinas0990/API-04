import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './shema';

const connectionString =
    env.NODE_ENV === 'test' && env.TEST_DATABASE_URL
        ? env.TEST_DATABASE_URL
        : env.DATABASE_URL;

const client = postgres(connectionString, {
    max: env.NODE_ENV === 'test' ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;