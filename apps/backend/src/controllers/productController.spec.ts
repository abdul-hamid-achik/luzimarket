
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

jest.mock('@/db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('productController', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('createProduct', () => {
  it('should create and return new product', async () => {
    const req = makeReq({ name: 'P', description: 'D', price: 9.99, categoryId: 1 });
      const dbRec = { id: 1, name: 'P', description: 'D', price: '9.99', categoryId: 1 };
      const mReturning = jest.fn().mockResolvedValue([dbRec]);
      const mValues = jest.fn().mockReturnValue({ returning: mReturning });
      (db.insert as jest.Mock).mockReturnValue({ values: mValues });
    const res = makeRes();
    await createProduct(req, res);
    expect(db.insert).toHaveBeenCalled();
      expect(mValues).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(res.json).toHaveBeenCalledWith({ ...dbRec, price: parseFloat(dbRec.price) });
    });

  it('should handle errors', async () => {
    const req = makeReq({});
    (db.insert as jest.Mock).mockImplementation(() => { throw new Error('oops'); });
    const res = makeRes();
    await createProduct(req, res);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({ error: 'oops' });
  });
  });

  describe('getProducts', () => {
  it('should return formatted products', async () => {
    const dbRecs = [{ id: 2, name: 'X', price: '5.00' }];
    (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockResolvedValue(dbRecs) });
    const res = makeRes();
    await getProducts(makeReq(), res);
    expect(res.json).toHaveBeenCalledWith([{ ...dbRecs[0], price: parseFloat(dbRecs[0].price) }]);
  });
  });

  describe('getProduct', () => {
  it('should return a product when found', async () => {
    const id = 3;
    const dbRec = { id, name: 'Y', price: '7.00' };
    const mLimit = jest.fn().mockResolvedValue([dbRec]);
    const mWhere = jest.fn().mockReturnValue({ limit: mLimit });
    (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: mWhere }) });
    const res = makeRes();
    await getProduct(makeReq({}, { id: String(id) }), res);
    expect(res.json).toHaveBeenCalledWith({ ...dbRec, price: parseFloat(dbRec.price) });
  });

  it('should 404 when not found', async () => {
    const mLimit = jest.fn().mockResolvedValue([]);
    const mWhere = jest.fn().mockReturnValue({ limit: mLimit });
    (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: mWhere }) });
    const res = makeRes();
    await getProduct(makeReq({}, { id: '10' }), res);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });
  });

  describe('updateProduct', () => {
  it('should update and return product', async () => {
    const id = 4;
    const dbRec = { id, price: '8.50', name: 'Z' };
    const mReturning = jest.fn().mockResolvedValue([dbRec]);
    const mWhere = jest.fn().mockReturnValue({ returning: mReturning });
    const mSet = jest.fn().mockReturnValue({ where: mWhere });
    (db.update as jest.Mock).mockReturnValue({ set: mSet });
    const res = makeRes();
    await updateProduct(makeReq({}, { id: String(id) }), res);
    expect(res.json).toHaveBeenCalledWith({ ...dbRec, price: parseFloat(dbRec.price) });
  });

  it('should 404 if not found', async () => {
    const mReturning = jest.fn().mockResolvedValue([]);
    const mWhere = jest.fn().mockReturnValue({ returning: mReturning });
    const mSet = jest.fn().mockReturnValue({ where: mWhere });
    (db.update as jest.Mock).mockReturnValue({ set: mSet });
    const res = makeRes();
    await updateProduct(makeReq({}, { id: '5' }), res);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });
  });

  describe('deleteProduct', () => {
  it('should delete and return success', async () => {
    const dbRec = { id: 6 };
    const mReturning = jest.fn().mockResolvedValue([dbRec]);
    const mWhere = jest.fn().mockReturnValue({ returning: mReturning });
    (db.delete as jest.Mock).mockReturnValue({ where: mWhere });
    const res = makeRes();
    await deleteProduct(makeReq({}, { id: '6' }), res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('should 404 if not found', async () => {
    const mReturning = jest.fn().mockResolvedValue([]);
    const mWhere = jest.fn().mockReturnValue({ returning: mReturning });
    (db.delete as jest.Mock).mockReturnValue({ where: mWhere });
    const res = makeRes();
    await deleteProduct(makeReq({}, { id: '7' }), res);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });
  });
});