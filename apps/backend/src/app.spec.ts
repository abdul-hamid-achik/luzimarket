import request from 'supertest';
import { vi } from 'vitest';
import { db } from '@/db';
import app from './app';
import { Petitions } from './data/petitionsData';
import { AdmissionPetitions } from './data/petitionsAdmissionsData';
import { ProductPetitions } from './data/petitionsProductsData';
import { BranchPetitions } from './data/petitionsBranchesData';

describe('Express app', () => {
  // No DB mocking, use real DB


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
    const res = await request(app).get('/api/petitions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(Petitions);
  });

  it('GET /api/petitions/admissions should return admissions data', async () => {
    const res = await request(app).get('/api/petitions/admissions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(AdmissionPetitions);
  });

  it('GET /api/petitions/products should return product petitions', async () => {
    const res = await request(app).get('/api/petitions/products');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(ProductPetitions);
  });

  it('GET /api/petitions/branches should return branch petitions', async () => {
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