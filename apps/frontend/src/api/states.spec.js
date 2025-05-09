import api from './client';
import { getStates } from './states';

vi.mock('./client');

describe('states API', () => {
  afterEach(() => vi.resetAllMocks());

  it('getStates should fetch states', async () => {
    const mockData = [{ label: 'X', value: 'x' }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getStates();
    expect(api.get).toHaveBeenCalledWith('/states');
    expect(res).toEqual(mockData);
  });
});