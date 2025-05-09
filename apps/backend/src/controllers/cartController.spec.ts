import { StatusCodes } from 'http-status-codes';
import {
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from './cartController';
import { db } from '@/db';
import { carts, cartItems, products, users, orders } from '../schema';
import { eq } from 'drizzle-orm';
import { makeReq, makeRes } from '../test-utils';

describe('cartController', () => {
  beforeEach(async () => {
    // Clear and seed necessary tables
    await db.delete(orders);
    await db.delete(cartItems);
    await db.delete(carts);
    await db.delete(products);
    await db.delete(users);
    // Seed users and product for cart tests
    await db.insert(users).values([
      { id: 10, email: 'u10@x.com', passwordHash: 'pw', role: 'customer' },
      { id: 12, email: 'u12@x.com', passwordHash: 'pw', role: 'customer' }
    ]);
    await db.insert(products).values({ id: 5, name: 'Test Product', description: 'desc', price: 10.0, categoryId: 1 });
  });
  afterEach(async () => {
    await db.delete(orders);
    await db.delete(cartItems);
    await db.delete(carts);
    await db.delete(products);
    await db.delete(users);
  });

  describe('addItemToCart', () => {
    it('should return 401 if no user or guest', async () => {
      const req = { user: {} } as any;
      const res = makeRes();
      await addItemToCart(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should create cart and item when none exists', async () => {
      const req: any = { user: { id: 10 }, body: { productId: 5, quantity: 2 } };
      // No cart exists, so addItemToCart should create one and add the item
// No need to mock, just check DB after

      const res = makeRes();
      await addItemToCart(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      // Get the cart item from DB
      const items = await db.select().from(cartItems);
      expect(items.length).toBe(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ productId: 5, quantity: 2 }));
    });
  });

  describe('updateCartItem', () => {
    it('should update and return item', async () => {
      const req: any = { params: { itemId: '7' }, body: { quantity: 3 } };
      
      const res = makeRes();
      // Seed a cart and an item to update
      const [{ id: cartId }] = await db.insert(carts).values({ userId: 10 }).returning();
      const [{ id }] = await db.insert(cartItems).values({ cartId, productId: 5, quantity: 1 }).returning();
      req.params.itemId = String(id);
      await updateCartItem(req, res);
      const updated = await db.select().from(cartItems).where(eq(cartItems.id, id));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id, quantity: 3 }));
    });

    it('should return 404 if not found', async () => {
      const req: any = { params: { itemId: '8' }, body: { quantity: 1 } };
      
      const res = makeRes();
      await updateCartItem(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cart item not found' });
    });
  });

  describe('removeCartItem', () => {
    it('should remove item and return success', async () => {
      const req: any = { params: { itemId: '9' } };
      
      const res = makeRes();
      await removeCartItem(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('clearCart', () => {
    it('should return 401 if no user or guest', async () => {
      const req = { user: {} } as any;
      const res = makeRes();
      await clearCart(req, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should delete items and return success', async () => {
      const cartData = [{ id: 11 }];
      
      const req: any = { user: { id: 12 } };
      const res = makeRes();
      // Seed a cart and item for user 12
      const [{ id: cartId }] = await db.insert(carts).values({ userId: 12 }).returning();
      await db.insert(cartItems).values({ cartId, productId: 5, quantity: 1 });
      await clearCart(req, res);
      const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
      expect(items.length).toBe(0);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});