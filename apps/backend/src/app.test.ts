import request from 'supertest';
import app from './app';

describe('API Smoke Tests', () => {
  it('should serve Swagger UI at /api/docs', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toMatch(/html/);
  });
});