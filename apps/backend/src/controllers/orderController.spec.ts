import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getOrders, getOrder } from './orderController';
import { db } from '@/db';

// Mock Express response
function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('orderController', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('getOrders', () => {
    it('should return 401 if unauthorized', async () => {
      const req = { user: {} } as any;
      const res = mockResponse();
      await getOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return user orders', async () => {
      const userOrders = [{ id: 1, total: '10.00' }];
      const mWhere = jest.fn().mockResolvedValue(userOrders);
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: mWhere }) });
      const req: any = { user: { id: 3 } };
      const res = mockResponse();
      await getOrders(req, res);
      expect(mWhere).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(userOrders);
    });
  });

  describe('getOrder', () => {
    it('should return 401 if unauthorized', async () => {
      const req = { user: {} } as any;
      const res = mockResponse();
      await getOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });

    it('should return 404 if order not found', async () => {
      const mLimit = jest.fn().mockResolvedValue([]);
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mLimit }) }) });
      const req: any = { user: { id: 4 }, params: { id: '10' } };
      const res = mockResponse();
      await getOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
    });

    it('should return order and items when found', async () => {
      const order = { id: 5, userId: 2, total: '20.00' };
      const items = [{ id: 100, orderId: 5, quantity: 1 }];
      // First select for order
      const mLimit = jest.fn().mockResolvedValue([order]);
      const mWhereOrder = jest.fn().mockReturnValue({ limit: mLimit });
      (db.select as jest.Mock)
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: mWhereOrder }) })
        // then select items
        .mockReturnValueOnce({ from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(items) }) });
      const req: any = { user: { id: 2 }, params: { id: '5' } };
      const res = mockResponse();
      await getOrder(req, res);
      expect(res.json).toHaveBeenCalledWith({ order, items });
    });
  });
});