import api from './client';
import { getBranchPetitions } from './petitionsBranches';

jest.mock('./client');

describe('petitionsBranches API', () => {
  afterEach(() => jest.resetAllMocks());

  it('getBranchPetitions should fetch branch petitions', async () => {
    const mockData = [{ id: 1, name: 'B' }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getBranchPetitions();
    expect(api.get).toHaveBeenCalledWith('/petitions/branches');
    expect(res).toEqual(mockData);
  });
});