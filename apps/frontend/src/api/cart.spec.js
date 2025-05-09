import api from '@/api/client';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from './cart';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Cart API', () => {
  it('calls getCart and returns data', async () => {
    const mockData = [{ id: 1 }];
    api.get.mockResolvedValue({ data: mockData });
    const result = await getCart();
    expect(api.get).toHaveBeenCalledWith('/cart');
    expect(result).toEqual(mockData);
  });

  it('calls addToCart and returns data', async () => {
    const payload = { itemId: 1, quantity: 1 };
    const mockData = { success: true };
    api.post.mockResolvedValue({ data: mockData });
    const result = await addToCart(payload);
    expect(api.post).toHaveBeenCalledWith('/cart', payload);
    expect(result).toEqual(mockData);
  });

  it('calls updateCartItem and returns data', async () => {
    const payload = { itemId: 1, quantity: 2 };
    const mockData = { success: true };
    api.put.mockResolvedValue({ data: mockData });
    const result = await updateCartItem(payload);
    expect(api.put).toHaveBeenCalledWith('/cart/1', { quantity: 2 });
    expect(result).toEqual(mockData);
  });

  it('calls removeCartItem and returns data', async () => {
    const mockData = { success: true };
    api.delete.mockResolvedValue({ data: mockData });
    const result = await removeCartItem(1);
    expect(api.delete).toHaveBeenCalledWith('/cart/1');
    expect(result).toEqual(mockData);
  });

  it('calls clearCart and returns data', async () => {
    const mockData = [];
    api.delete.mockResolvedValue({ data: mockData });
    const result = await clearCart();
    expect(api.delete).toHaveBeenCalledWith('/cart');
    expect(result).toEqual(mockData);
  });
});