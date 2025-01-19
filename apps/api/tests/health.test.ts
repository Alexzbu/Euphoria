import { describe, expect, it } from 'vitest';
import { api } from './fixtures.js';

describe('GET /health', () => {
  it('reports ok while the database is reachable', async () => {
    const res = await api().get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', checks: { database: 'up' } });
  });

  it('answers json for an unknown path', async () => {
    const res = await api().get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
