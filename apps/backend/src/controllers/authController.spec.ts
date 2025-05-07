import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { register, login, guest } from './authController';
import { db } from '@/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Express response
function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

jest.mock('@/db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
  }
}));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('authController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const fakeHash = 'hashedpw';
      (bcrypt.hash as jest.Mock).mockResolvedValue(fakeHash);
      const newUser = { id: 1, email: 'a@b.com', role: 'user' };
      const mReturning = jest.fn().mockResolvedValue([newUser]);
      const mValues = jest.fn().mockReturnValue({ returning: mReturning });
      (db.insert as jest.Mock).mockReturnValue({ values: mValues });
      const req = { body: { email: 'a@b.com', password: 'pw123' } } as Request;
      const res = mockResponse();
      await register(req, res);
      expect(bcrypt.hash).toHaveBeenCalledWith('pw123', 10);
      expect(db.insert).toHaveBeenCalled();
      expect(mValues).toHaveBeenCalledWith({ email: 'a@b.com', passwordHash: fakeHash });
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith({ user: newUser });
    });

    it('should handle duplicate email error', async () => {
      const error = { code: '23505' };
      (db.insert as jest.Mock).mockImplementation(() => { throw error; });
      const req = { body: { email: 'dup@b.com', password: 'pw' } } as Request;
      const res = mockResponse();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already in use' });
    });
  });

  describe('login', () => {
    const userRec = { id: 2, email: 'u@v.com', passwordHash: 'hash', role: 'role' };
    it('should reject invalid credentials when user not found', async () => {
      const mLimit = jest.fn().mockResolvedValue([]);
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mLimit }) }) });
      const req = { body: { email: 'x@x.com', password: 'pw' } } as any;
      const res = mockResponse();
      await login(req, res as any);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should reject when password does not match', async () => {
      const mLimit = jest.fn().mockResolvedValue([userRec]);
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mLimit }) }) });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const req = { body: { email: 'u@v.com', password: 'wrong' } } as any;
      const res = mockResponse();
      await login(req, res as any);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hash');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should login and return JWT token', async () => {
      const mLimit = jest.fn().mockResolvedValue([userRec]);
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mLimit }) }) });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const fakeToken = 'tok';
      (jwt.sign as jest.Mock).mockReturnValue(fakeToken);
      const req = { body: { email: 'u@v.com', password: 'pw' }, headers: {} } as any;
      const res = mockResponse();
      await login(req, res as any);
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ token: fakeToken });
    });
  });

  describe('guest', () => {
    it('should generate a guest token', () => {
      const fakeToken = 'guestToken';
      (jwt.sign as jest.Mock).mockReturnValue(fakeToken);
      const res = mockResponse();
      guest({} as Request, res);
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ token: fakeToken });
    });
  });
});