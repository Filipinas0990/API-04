import { db } from '../src/database/client';

beforeAll(async () => {
    console.log('🧪 Banco de teste pronto');
});

afterAll(async () => {
    console.log('✅ Testes finalizados');
});