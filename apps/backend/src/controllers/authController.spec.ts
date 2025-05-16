
import { StatusCodes } from 'http-status-codes';
import { register, login, guest } from './authController';
import { db } from '@/db';
import { users, carts, orders } from '../schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { vi } from 'vitest';

vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

// Mock Express response
function mockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('authController', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    // Clean and seed orders, carts, and users tables
    await db.delete(orders);
    await db.delete(carts);
    await db.delete(users);
    await db.insert(users).values([
      { email: 'existing@b.com', passwordHash: 'hashedpw', role: 'user' },
      { email: 'u@v.com', passwordHash: 'hash', role: 'role' },
    ]);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const fakeHash = 'hashedpw';
      (bcrypt.hash as vi.Mock).mockResolvedValue(fakeHash);
      const req = { body: { email: 'a@b.com', password: 'pw123' } } as any;
      const res = mockResponse();
      await register(req, res);
      expect(bcrypt.hash).toHaveBeenCalledWith('pw123', 10);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      // Check user in DB
      const created = await db.select().from(users).where(eq(users.email, 'a@b.com'));
      expect(created.length).toBe(1);
      expect(res.json).toHaveBeenCalledWith({ user: expect.objectContaining({ email: 'a@b.com' }) });
    });

    it('should handle duplicate email error', async () => {
      (bcrypt.hash as vi.Mock).mockResolvedValue('hashedpw');
      // Insert user with email first
      await db.insert(users).values({ email: 'dup@b.com', passwordHash: 'pw', role: 'user' });
      const req = { body: { email: 'dup@b.com', password: 'pw' } } as any;
      const res = mockResponse();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already in use' });
    });
  });

  describe('login', () => {
    it('should reject invalid credentials when user not found', async () => {
      (bcrypt.compare as vi.Mock).mockResolvedValue(false);
      const req = { body: { email: 'notfound@x.com', password: 'pw' } } as any;
      const res = mockResponse();
      await login(req, res as any);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should reject when password does not match', async () => {
      (bcrypt.compare as vi.Mock).mockResolvedValue(false);
      const req = { body: { email: 'u@v.com', password: 'wrong' } } as any;
      const res = mockResponse();
      await login(req, res as any);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hash');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should login and return JWT token', async () => {
      (bcrypt.compare as vi.Mock).mockResolvedValue(true);
      const fakeToken = 'tok';
      (jwt.sign as vi.Mock).mockReturnValue(fakeToken);
      const req = { body: { email: 'u@v.com', password: 'pw' }, headers: {} } as any;
      const res = mockResponse();
      await login(req, res as any);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ token: fakeToken });
    });
  });

  describe('guest', () => {
    it('should generate a guest token', () => {
      const fakeToken = 'guestToken';
      (jwt.sign as vi.Mock).mockReturnValue(fakeToken);
      const res = mockResponse();
      guest({} as Request, res);
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ token: fakeToken });
    });
  });
});