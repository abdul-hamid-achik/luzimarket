import api from './client';
import { registerUser, loginUser } from './auth';
import { registerResponse, loginResponse } from '../__fixtures__/auth.fixture';

jest.mock('./client');

describe('auth API', () => {
  afterEach(() => jest.resetAllMocks());

  it('registerUser should post registration data', async () => {
    const payload = { email: 'a@b.com', password: 'pw' };
    api.post.mockResolvedValue({ data: registerResponse });
    const res = await registerUser(payload);
    expect(api.post).toHaveBeenCalledWith('/auth/register', payload);
    expect(res).toEqual(registerResponse);
  });

  it('loginUser should post login data', async () => {
    const payload = { email: 'a@b.com', password: 'pw' };
    api.post.mockResolvedValue({ data: loginResponse });
    const res = await loginUser(payload);
    expect(api.post).toHaveBeenCalledWith('/auth/login', payload);
    expect(res).toEqual(loginResponse);
  });
});