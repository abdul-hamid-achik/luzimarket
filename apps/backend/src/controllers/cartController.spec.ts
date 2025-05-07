import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from './cartController';
import { db, closePool } from '@/db';

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
    update: jest.fn(),
    delete: jest.fn(),
  },
  closePool: jest.fn(),
}));

describe('cartController', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('addItemToCart', () => {
    it('should return 401 if no user or guest', async () => {
      const req = { user: {} } as any;
      const res = mockResponse();
      await addItemToCart(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should create cart and item when none exists', async () => {
      const req: any = { user: { id: 10 }, body: { productId: 5, quantity: 2 } };
      // First, select cart returns empty array
      const mCartSelect = jest.fn().mockResolvedValue([]);
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mCartSelect }) }) });
      // Create new cart
      const newCart = { id: 20 };
      const mCartReturn = jest.fn().mockResolvedValue([newCart]);
      (db.insert as jest.Mock)
        .mockReturnValueOnce({ values: jest.fn().mockReturnValue({ returning: mCartReturn }) });
      // Insert item
      const newItem = { id: 30, productId: 5, quantity: 2 };
      const mItemReturn = jest.fn().mockResolvedValue([newItem]);
      (db.insert as jest.Mock)
        .mockReturnValueOnce({ values: jest.fn().mockReturnValue({ returning: mItemReturn }) });
      const res = mockResponse();
      await addItemToCart(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newItem);
    });
  });

  describe('updateCartItem', () => {
    it('should update and return item', async () => {
      const req: any = { params: { itemId: '7' }, body: { quantity: 3 } };
      const updated = [{ id: 7, quantity: 3 }];
      const mWhere = jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue(updated) });
      (db.update as jest.Mock).mockReturnValue({ set: jest.fn().mockReturnValue({ where: mWhere }) });
      const res = mockResponse();
      await updateCartItem(req, res);
      expect(res.json).toHaveBeenCalledWith(updated[0]);
    });

    it('should return 404 if not found', async () => {
      const req: any = { params: { itemId: '8' }, body: { quantity: 1 } };
      const mWhere = jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) });
      (db.update as jest.Mock).mockReturnValue({ set: jest.fn().mockReturnValue({ where: mWhere }) });
      const res = mockResponse();
      await updateCartItem(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cart item not found' });
    });
  });

  describe('removeCartItem', () => {
    it('should remove item and return success', async () => {
      const req: any = { params: { itemId: '9' } };
      (db.delete as jest.Mock).mockReturnValue({ where: jest.fn() });
      const res = mockResponse();
      await removeCartItem(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('clearCart', () => {
    it('should return 401 if no user or guest', async () => {
      const req = { user: {} } as any;
      const res = mockResponse();
      await clearCart(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should delete items and return success', async () => {
      const cartData = [{ id: 11 }];
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(cartData) }) }) });
      const mDelete = jest.fn();
      (db.delete as jest.Mock).mockReturnValue({ where: mDelete });
      const req: any = { user: { id: 12 } };
      const res = mockResponse();
      await clearCart(req, res);
      expect(mDelete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});