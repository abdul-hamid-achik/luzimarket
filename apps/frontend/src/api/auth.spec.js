import api from '@/api/client';
import { registerUser, loginUser } from './auth';
import { registerResponse, loginResponse } from '../__fixtures__/auth.fixture';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('auth API', () => {
  afterEach(() => vi.resetAllMocks());

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

describe('registerUser', () => {
  it('calls api.post with /auth/register and payload, returns data', async () => {
    const payload = { email: 'test@example.com', password: 'password' };
    const mockData = { jwt: 'mockjwt', user: { id: 1, email: 'test@example.com' } };
    api.post.mockResolvedValue({ data: mockData });
    const result = await registerUser(payload);
    expect(api.post).toHaveBeenCalledWith('/auth/register', payload);
    expect(result).toEqual(mockData);
  });
});

describe('loginUser', () => {
  it('calls api.post with /auth/login and payload, returns data', async () => {
    const payload = { email: 'user', password: 'pass' };
    const mockData = { jwt: 'mockjwt', user: { id: 1, email: 'user' } };
    api.post.mockResolvedValue({ data: mockData });
    const result = await loginUser(payload);
    expect(api.post).toHaveBeenCalledWith('/auth/login', payload);
    expect(result).toEqual(mockData);
  });
});