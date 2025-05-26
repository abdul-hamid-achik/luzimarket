import api from './client';
import { getBranchPetitions } from './petitionsBranches';

vi.mock('./client');

describe('petitionsBranches API', () => {
  afterEach(() => vi.resetAllMocks());

  it('getBranchPetitions should fetch branch petitions', async () => {
    const mockData = [{ id: 1, name: 'B' }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getBranchPetitions();
    expect(api.get).toHaveBeenCalledWith('/petitions/branches');
    expect(res).toEqual(mockData);
  });
});