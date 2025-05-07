import api from './client';
import { getProducts, getProduct } from './products';

jest.mock('./client');

describe('products API', () => {
  afterEach(() => jest.resetAllMocks());

  it('getProducts should fetch list of products', async () => {
    const mockData = [{ id: 1, name: 'A' }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getProducts();
    expect(api.get).toHaveBeenCalledWith('/products');
    expect(res).toEqual(mockData);
  });

  it('getProduct should fetch single product by id', async () => {
    const mockData = { id: 2, name: 'B' };
    api.get.mockResolvedValue({ data: mockData });
    const res = await getProduct(2);
    expect(api.get).toHaveBeenCalledWith('/products/2');
    expect(res).toEqual(mockData);
  });
});