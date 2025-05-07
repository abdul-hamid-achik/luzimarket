import api from './client';
import { getCategories } from './categories';

jest.mock('./client');

describe('categories API', () => {
  afterEach(() => jest.resetAllMocks());

  it('getCategories should fetch categories', async () => {
    const mockData = [{ id: 1, name: 'Cat' }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getCategories();
    expect(api.get).toHaveBeenCalledWith('/categories');
    expect(res).toEqual(mockData);
  });
});