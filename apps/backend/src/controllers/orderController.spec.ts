import { StatusCodes } from 'http-status-codes';
import { getOrders, getOrder } from './orderController';
import { db } from '@/db';

import { orders, orderItems, users, carts, products } from '@/schema';
import { eq } from 'drizzle-orm';
import { makeReq, makeRes } from '../test-utils';

describe('orderController', () => {
  beforeEach(async () => {
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(carts);
    await db.delete(users);
    await db.delete(products);
    // Seed products
    await db.insert(products).values({ id: 1, name: 'Test Product', description: 'desc', price: 10.0, categoryId: 1 });
    // Seed users needed for orders
    await db.insert(users).values([
      { id: 2, email: 'u2@x.com', passwordHash: 'pw', role: 'customer' },
      { id: 3, email: 'u3@x.com', passwordHash: 'pw', role: 'customer' }
    ]);
    // Seed an order for userId 3
    await db.insert(orders).values({ id: 1, userId: 3, total: '10.00' });
    await db.insert(orderItems).values({ id: 10, orderId: 1, productId: 1, quantity: 2, price: 10.0 });
  });
  afterEach(async () => {
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(carts);
    await db.delete(users);
    await db.delete(products);
  });

  describe('getOrders', () => {
    it('should return 401 if unauthorized', async () => {
      const req = { user: {} } as any;
      const res = makeRes();
      await getOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return user orders', async () => {
      const userOrders = [{ id: 1, total: '10.00' }];
      
      const req: any = { user: { id: 3 } };
      const res = makeRes();
      await getOrders(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, total: '10.00' })
        ])
      );
    });
  });

  describe('getOrder', () => {
    it('should return 401 if unauthorized', async () => {
      const req = { user: {} } as any;
      const res = makeRes();
      await getOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });

    it('should return 404 if order not found', async () => {
      
      const req: any = { user: { id: 4 }, params: { id: '10' } };
      const res = makeRes();
      await getOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
    });

    it('should return order and items when found', async () => {
      // Seed order and items for userId 2
      const [{ id: orderId }] = await db.insert(orders).values({ userId: 2, total: '20.00' }).returning();
      await db.insert(orderItems).values({ id: 100, orderId, productId: 1, quantity: 1, price: 10.0 });
      const req: any = { user: { id: 2 }, params: { id: String(orderId) } };
      const res = makeRes();
      await getOrder(req, res);
      // Fetch from DB to compare
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      expect(res.json).toHaveBeenCalledWith({ order: expect.objectContaining({ id: orderId, userId: 2, total: '20.00' }), items: expect.arrayContaining([expect.objectContaining({ orderId, quantity: 1 })]) });
    });
  });
});