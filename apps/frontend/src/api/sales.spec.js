import api from './client';
import { getSales } from './sales';

vi.mock('./client');

describe('sales API', () => {
  afterEach(() => vi.resetAllMocks());

  it('getSales should fetch sales data', async () => {
    const mockData = [{ date: 'd', May: 1 }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getSales();
    expect(api.get).toHaveBeenCalledWith('/sales');
    expect(res).toEqual(mockData);
  });
});