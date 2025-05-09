import api from './client';
import { getAdmissionPetitions } from './petitionsAdmissions';

vi.mock('./client');

describe('petitionsAdmissions API', () => {
  afterEach(() => vi.resetAllMocks());

  it('getAdmissionPetitions should fetch admission petitions', async () => {
    const mockData = [{ id: 1, name: 'A' }];
    api.get.mockResolvedValue({ data: mockData });
    const res = await getAdmissionPetitions();
    expect(api.get).toHaveBeenCalledWith('/petitions/admissions');
    expect(res).toEqual(mockData);
  });
});