import { StatusCodes } from 'http-status-codes';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { db } from '@/db';
import { products, categories as categoriesTable } from '../schema';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from './categoryController';
import { makeReq, makeRes } from '../test-utils';
import { categories as categoriesFixture } from '../__fixtures__/categories.fixture';
import { categories as categoriesTable } from '../schema';
import { eq } from 'drizzle-orm';

describe('categoryController', () => {
  beforeEach(async () => {
    // Truncate products first to avoid FK errors, then categories
    await db.delete(products);
    await db.delete(categoriesTable);
    await db.insert(categoriesTable).values(categoriesFixture);
  });
  afterEach(async () => {
    // Clean up after each test
    await db.delete(products);
    await db.delete(categoriesTable);
  });

  describe('getCategories', () => {
    it('should return list of categories', async () => {
      const res = makeRes();
      await getCategories(makeReq(), res);
      // Only check that all category names are present, ignore id/createdAt
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining(
          categoriesFixture.map(({ name }) => expect.objectContaining({ name }))
        )
      );
    });
  });

  describe('getCategory', () => {
    it('should return a category when found', async () => {
      // Find the first category in the DB
      const all = await db.select().from(categoriesTable);
      const id = all[0].id;
      const res = makeRes();
      await getCategory(makeReq({}, { id: String(id) }), res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining(categoriesFixture[0])
      );
    });

    it('should return 404 when category not found', async () => {
      const res = makeRes();
      await getCategory(makeReq({}, { id: '999' }), res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('createCategory', () => {
    it('should create and return a new category', async () => {
      // Use a unique name not present in the fixture
      const res = makeRes();
      await createCategory(makeReq({ name: 'UniqueTestCategory' }), res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      // Check that the category was actually created in the db
      const all = await db.select().from(categoriesTable);
      expect(all.some((cat: { name: string }) => cat.name === 'UniqueTestCategory')).toBe(true);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'UniqueTestCategory' })
      );
    });

    it('should handle duplicate category error', async () => {
      // Insert a duplicate
      // Insert a category with a unique name (let DB assign id)
      await db.insert(categoriesTable).values({ name: 'Dup' });
      const res = makeRes();
      await createCategory(makeReq({ name: 'Dup' }), res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category already exists' });
    });

    it('should handle generic error', async () => {
      // Simulate error by passing undefined body
      const res = makeRes();
      await createCategory(makeReq(undefined), res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('updateCategory', () => {
    it('should update and return an existing category', async () => {
      // Find the third category in the DB
      const all = await db.select().from(categoriesTable);
      const id = all[2].id;
      const res = makeRes();
      await updateCategory({ params: { id: String(id) }, body: { name: 'Updated' } } as any, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id, name: 'Updated' })
      );
      // Check db
      const updated = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
      expect(updated[0].name).toBe('Updated');
    });

    it('should return 404 if update target not found', async () => {
      const res = makeRes();
      await updateCategory({ params: { id: '999' }, body: { name: 'Nope' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });

    it('should handle duplicate name on update', async () => {
      // Insert a duplicate
      await db.insert(categoriesTable).values({ name: 'Dup' });
      const res = makeRes();
      // Find the first category in the DB
      const all = await db.select().from(categoriesTable);
      await updateCategory({ params: { id: String(all[0].id) }, body: { name: 'Dup' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category name already exists' });
    });
  });

  describe('deleteCategory', () => {
    it('should delete and return success', async () => {
      // Insert a new category to delete
      const [{ id }] = await db.insert(categoriesTable).values({ name: 'ToDelete' }).returning();
      const res = makeRes();
      await deleteCategory({ params: { id: String(id) } } as any, res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
      // Should actually be deleted
      const found = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
      expect(found.length).toBe(0);
    });

    it('should return 404 if delete target not found', async () => {
      const res = makeRes();
      await deleteCategory({ params: { id: '999' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });
});