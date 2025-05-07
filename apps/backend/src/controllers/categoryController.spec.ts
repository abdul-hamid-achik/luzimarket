import { StatusCodes } from 'http-status-codes';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from './categoryController';
import { db } from '@/db';
import { makeReq, makeRes } from '../test-utils';
import { categories } from '../__fixtures__/categories.fixture';

jest.mock('@/db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('categoryController', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('getCategories', () => {
    it('should return list of categories', async () => {
      const res = makeRes();
      // Mock select().from(). returning fixture
      const mFrom = jest.fn().mockResolvedValue(categories);
      (db.select as jest.Mock).mockReturnValue({ from: mFrom });
      await getCategories(makeReq(), res);
      expect(db.select).toHaveBeenCalled();
      expect(mFrom).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(categories);
    });
  });

  describe('getCategory', () => {
    it('should return a category when found', async () => {
      const id = categories[0].id;
      const mLimit = jest.fn().mockResolvedValue([categories[0]]);
      const mWhere = jest.fn().mockReturnValue({ limit: mLimit });
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: mWhere }) });
      const res = makeRes();
      await getCategory(makeReq({}, { id: String(id) }), res);
      expect(mWhere).toHaveBeenCalled();
      expect(mLimit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(categories[0]);
    });

    it('should return 404 when category not found', async () => {
      const mLimit = jest.fn().mockResolvedValue([]);
      const mWhere = jest.fn().mockReturnValue({ limit: mLimit });
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: mWhere }) });
      const res = makeRes();
      await getCategory(makeReq({}, { id: '999' }), res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('createCategory', () => {
    it('should create and return a new category', async () => {
      const newCat = { id: 4, name: 'Garden' };
      const mReturning = jest.fn().mockResolvedValue([newCat]);
      const mValues = jest.fn().mockReturnValue({ returning: mReturning });
      (db.insert as jest.Mock).mockReturnValue({ values: mValues });
      const res = makeRes();
      await createCategory(makeReq({ name: 'Garden' }), res);
      expect(db.insert).toHaveBeenCalled();
      expect(mValues).toHaveBeenCalledWith({ name: 'Garden' });
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith(newCat);
    });

    it('should handle duplicate category error', async () => {
      const error: any = { code: '23505' };
      (db.insert as jest.Mock).mockImplementation(() => { throw error; });
      const res = makeRes();
      await createCategory(makeReq({ name: 'Dup' }), res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category already exists' });
    });

    it('should handle generic error', async () => {
      const error: any = {};
      (db.insert as jest.Mock).mockImplementation(() => { throw error; });
      const res = makeRes();
      await createCategory(makeReq({ name: 'Err' }), res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('updateCategory', () => {
    it('should update and return an existing category', async () => {
      const id = 3;
      const updated = { id, name: 'Updated' };
      const mReturning = jest.fn().mockResolvedValue([updated]);
      const mSet = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: mReturning }) });
      (db.update as jest.Mock).mockReturnValue({ set: mSet });
      const res = makeRes();
      await updateCategory({ params: { id: String(id) }, body: { name: 'Updated' } } as any, res);
      expect(db.update).toHaveBeenCalled();
      expect(mSet).toHaveBeenCalledWith({ name: 'Updated' });
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('should return 404 if update target not found', async () => {
      const id = 4;
      const mReturning = jest.fn().mockResolvedValue([]);
      const mSet = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: mReturning }) });
      (db.update as jest.Mock).mockReturnValue({ set: mSet });
      const res = makeRes();
      await updateCategory({ params: { id: String(id) }, body: { name: 'Nope' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });

    it('should handle duplicate name on update', async () => {
      const error = { code: '23505' };
      (db.update as jest.Mock).mockImplementation(() => { throw error; });
      const res = makeRes();
      await updateCategory({ params: { id: '1' }, body: { name: 'Dup' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category name already exists' });
    });
  });

  describe('deleteCategory', () => {
    it('should delete and return success', async () => {
      const id = 7;
      const mReturning = jest.fn().mockResolvedValue([{ id }]);
      (db.delete as jest.Mock).mockReturnValue({ where: jest.fn().mockReturnValue({ returning: mReturning }) });
      const res = makeRes();
      await deleteCategory({ params: { id: String(id) } } as any, res);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 404 if delete target not found', async () => {
      const mReturning = jest.fn().mockResolvedValue([]);
      (db.delete as jest.Mock).mockReturnValue({ where: jest.fn().mockReturnValue({ returning: mReturning }) });
      const res = makeRes();
      await deleteCategory({ params: { id: '8' } } as any, res);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });
});