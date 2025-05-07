import api from './client';
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from './cart';

jest.mock('./client');

describe('cart API', () => {
  afterEach(() => jest.resetAllMocks());

  it('getCart should fetch cart', async () => {
    const mockData = { cart: {}, items: [] };
    api.get.mockResolvedValue({ data: mockData });
    const res = await getCart();
    expect(api.get).toHaveBeenCalledWith('/cart');
    expect(res).toEqual(mockData);
  });

  it('addToCart should post new item', async () => {
    const payload = { productId: 1, quantity: 2 };
    const mockData = { id: 1, ...payload };
    api.post.mockResolvedValue({ data: mockData });
    const res = await addToCart(payload);
    expect(api.post).toHaveBeenCalledWith('/cart', payload);
    expect(res).toEqual(mockData);
  });

  it('updateCartItem should update item', async () => {
    const payload = { itemId: 5, quantity: 3 };
    const mockData = { id: 5, quantity: 3 };
    api.put.mockResolvedValue({ data: mockData });
    const res = await updateCartItem(payload);
    expect(api.put).toHaveBeenCalledWith(`/cart/${payload.itemId}`, { quantity: payload.quantity });
    expect(res).toEqual(mockData);
  });

  it('removeCartItem should delete item', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    const res = await removeCartItem(7);
    expect(api.delete).toHaveBeenCalledWith('/cart/7');
    expect(res).toEqual({ success: true });
  });

  it('clearCart should clear all items', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    const res = await clearCart();
    expect(api.delete).toHaveBeenCalledWith('/cart');
    expect(res).toEqual({ success: true });
  });
});