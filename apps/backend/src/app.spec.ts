import request from 'supertest';
import app from './app';
// Mock database select for non-petition routes
import { db } from '@/db';
jest.mock('@/db');
// Ensure select().from() returns an empty array by default
 (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockResolvedValue([]) });

describe('Express app', () => {
  it('should return 200 for health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('should issue a guest token', async () => {
    const res = await request(app).post('/api/auth/guest');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });
  it('GET /api/petitions should return petition data', async () => {
    const { Petitions } = await import('@/data/petitionsData');
    const res = await request(app).get('/api/petitions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(Petitions);
  });
  it('GET /api/petitions/admissions should return admissions data', async () => {
    const { AdmissionPetitions } = await import('@/data/petitionsAdmissionsData');
    const res = await request(app).get('/api/petitions/admissions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(AdmissionPetitions);
  });
  it('GET /api/petitions/products should return product petitions', async () => {
    const { ProductPetitions } = await import('@/data/petitionsProductsData');
    const res = await request(app).get('/api/petitions/products');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(ProductPetitions);
  });
  it('GET /api/petitions/branches should return branch petitions', async () => {
    const { BranchPetitions } = await import('@/data/petitionsBranchesData');
    const res = await request(app).get('/api/petitions/branches');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(BranchPetitions);
  });
  it('GET /api/admin/orders should return admin orders', async () => {
    const res = await request(app).get('/api/admin/orders');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  it('GET /api/states should return list of states', async () => {
    const res = await request(app).get('/api/states');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});