import api from './client';
import { getProductPetitions } from './petitionsProducts';

vi.mock('./client');

describe('petitionsProducts API', () => {
  afterEach(() => vi.resetAllMocks());

  it('getProductPetitions should fetch product petitions', async () => {
    const mockData = [{ id: 1, name: 'P' }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getProductPetitions();
    expect(api.get).toHaveBeenCalledWith('/petitions/products');
    expect(res).toEqual(mockData);
  });
});