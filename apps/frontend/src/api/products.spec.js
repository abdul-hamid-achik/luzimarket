import api from '@/api/client';
import { getProducts, getProduct } from './products';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('getProducts', () => {
  it('calls api.get with /products and returns data', async () => {
    const mockData = [{ id: 1 }];
    api.get.mockResolvedValue({ data: mockData });
    const result = await getProducts();
    expect(api.get).toHaveBeenCalledWith('/products');
    expect(result).toEqual(mockData);
  });
});

describe('getProduct', () => {
  it('calls api.get with /products/:id and returns data', async () => {
    const mockData = { id: 2 };
    api.get.mockResolvedValue({ data: mockData });
    const result = await getProduct(2);
    expect(api.get).toHaveBeenCalledWith('/products/2');
    expect(result).toEqual(mockData);
  });
});