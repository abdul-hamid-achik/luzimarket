
import { StatusCodes } from 'http-status-codes';
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from './productController';
import { db } from '@/db';
import { makeReq, makeRes } from '../test-utils';

// Response factory via test-utils



import { products as productsTable } from '../schema';
import { eq } from 'drizzle-orm';

describe('productController', () => {

const productsFixture = [
  { name: 'P', description: 'D', price: '9.99', categoryId: 1 },
  { name: 'X', description: 'DX', price: '5.00', categoryId: 1 },
  { name: 'Y', description: 'DY', price: '7.00', categoryId: 2 },
  { name: 'Z', description: 'DZ', price: '8.50', categoryId: 2 },
];

beforeEach(async () => {
  // Clear and seed the products table before each test
  await db.delete(productsTable);
  await db.insert(productsTable).values(productsFixture);
});

afterEach(async () => {
  // Clean up after each test
  await db.delete(productsTable);
});

  describe('createProduct', () => {
    it('should create and return new product', async () => {
      const req = makeReq({ name: 'New Product', description: 'A new product', price: 12.34, categoryId: 1 });
      const res = makeRes();
      await createProduct(req, res);
      // Fetch the product from the DB
      const created = await db.select().from(productsTable).where(eq(productsTable.name, 'New Product'));
      expect(created.length).toBe(1);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        ...created[0],
        price: parseFloat(created[0].price)
      });
    });

  it('should handle errors', async () => {
    const req = makeReq({});
    const res = makeRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  });

  describe('getProducts', () => {
    it('should return formatted products', async () => {
      const res = makeRes();
      await getProducts(makeReq(), res);
      const all = await db.select().from(productsTable);
      expect(res.json).toHaveBeenCalledWith(
        all.map((p: any) => ({ ...p, price: parseFloat(p.price) }))
      );
    });
  });

  describe('getProduct', () => {
    it('should return a product when found', async () => {
      const all = await db.select().from(productsTable);
      const id = all[2].id;
      const res = makeRes();
      await getProduct(makeReq({}, { id: String(id) }), res);
      const prod = await db.select().from(productsTable).where(eq(productsTable.id, id));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id })
      );
    });

    it('should 404 when not found', async () => {
      const res = makeRes();
      // Find a non-existent id
      const allProducts = await db.select().from(productsTable);
      const maxId = allProducts.reduce((max: number, p: any) => Math.max(max, p.id), 0);
      await getProduct(makeReq({}, { id: String(maxId + 1000) }), res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });
});

  describe('updateProduct', () => {
  it('should update and return product', async () => {
    const all = await db.select().from(productsTable);
    const id = all[3].id;
    const res = makeRes();
    await updateProduct(makeReq({ name: 'UpdatedZ', price: 99.99 }, { id: String(id) }), res);
    // Check response
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id, name: 'UpdatedZ', price: 99.99 })
    );
    // Check db
    const updated = await db.select().from(productsTable).where(eq(productsTable.id, id));
    expect(updated.length).toBe(1);
    expect(updated[0].name).toBe('UpdatedZ');
    expect(parseFloat(updated[0].price)).toBe(99.99);
  });

  it('should 404 if not found', async () => {
    const res = makeRes();
    // Find a non-existent id
    const maxId = (await db.select().from(productsTable)).reduce((max: number, p: any) => Math.max(max, p.id), 0);
    await updateProduct(makeReq({ name: 'Nope' }, { id: String(maxId + 1000) }), res);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });
  });

  describe('deleteProduct', () => {
  it('should delete and return success', async () => {
    // Insert a new product to delete
    const [{ id }] = await db.insert(productsTable).values({ name: 'ToDelete', description: 'TD', price: 1.23, categoryId: 1 }).returning();
    const res = makeRes();
    await deleteProduct(makeReq({}, { id: String(id) }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    // Should actually be deleted
    const found = await db.select().from(productsTable).where(eq(productsTable.id, id));
    expect(found.length).toBe(0);
  });

  it('should 404 if not found', async () => {
    const res = makeRes();
    const maxId = (await db.select().from(productsTable)).reduce((max: number, p: any) => Math.max(max, p.id), 0);
    await deleteProduct(makeReq({}, { id: String(maxId + 1000) }), res);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });
});
});