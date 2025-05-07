import api from './client';
import { createOrder, getOrders, getOrder } from './orders';

jest.mock('./client');

describe('orders API', () => {
  afterEach(() => jest.resetAllMocks());

  it('getOrders should fetch orders', async () => {
    const mockData = [{ id: 1, total: 10 }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getOrders();
    expect(api.get).toHaveBeenCalledWith('/orders');
    expect(res).toEqual(mockData);
  });

  it('getOrder should fetch a single order', async () => {
    const mockData = { id: 2, total: 20 };
    api.get.mockResolvedValue({ data: mockData });
    const res = await getOrder(2);
    expect(api.get).toHaveBeenCalledWith('/orders/2');
    expect(res).toEqual(mockData);
  });

  it('createOrder should post new order', async () => {
    const payload = { couponCode: 'X' };
    const mockData = { id: 3, total: 30 };
    api.post.mockResolvedValue({ data: mockData });
    const res = await createOrder(payload);
    expect(api.post).toHaveBeenCalledWith('/orders', payload);
    expect(res).toEqual(mockData);
  });
});