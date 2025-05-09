import api from './client';
import { getAdminOrders } from './adminOrders';

vi.mock('./client');

describe('adminOrders API', () => {
  afterEach(() => vi.resetAllMocks());

  it('getAdminOrders should fetch admin orders', async () => {
    const mockData = [{ id: 1, total: 100 }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getAdminOrders();
    expect(api.get).toHaveBeenCalledWith('/admin/orders');
    expect(res).toEqual(mockData);
  });
});