import IORedis from 'ioredis';
import { env } from './env';

let _client: IORedis | null = null;

export function getRedisClient(): IORedis | null {
    if (!env.REDIS_URL) return null;
    if (!_client) {
        _client = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
        _client.on('error', (err: Error) => {
            console.error('[Redis] Erro de conexão:', err.message);
        });
    }
    return _client;
}
