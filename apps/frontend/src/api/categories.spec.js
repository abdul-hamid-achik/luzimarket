import api from '@/api/client';
import { getCategories } from './categories';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('getCategories', () => {
  it('calls api.get with correct endpoint and returns data', async () => {
    const mockData = [{ id: 1 }];
    api.get.mockResolvedValue({ data: mockData });
    const result = await getCategories();
    expect(api.get).toHaveBeenCalledWith('/api/categories');
    expect(result).toEqual(mockData);
  });
});