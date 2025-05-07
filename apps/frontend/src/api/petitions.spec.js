import api from './client';
import { getPetitions } from './petitions';

jest.mock('./client');

describe('petitions API', () => {
  afterEach(() => jest.resetAllMocks());

  it('getPetitions should fetch petition cards', async () => {
    const mockData = [{ id: 1, title: 'X' }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getPetitions();
    expect(api.get).toHaveBeenCalledWith('/petitions');
    expect(res).toEqual(mockData);
  });
});