vi.mock('@/api/products', () => ({
  getProducts: () => Promise.resolve([{ name: 'Prod A' }, { name: 'Prod B' }]),
  getProduct: () => Promise.resolve({ name: 'Prod A' }),
}));
vi.mock('@/api/cart', () => ({
  getCart: () => Promise.resolve({ items: [{ productName: 'Item 1' }, { productName: 'Item 2' }] }),
  addToCart: () => Promise.resolve({}),
  updateCartItem: () => Promise.resolve({}),
  removeCartItem: () => Promise.resolve({}),
  clearCart: () => Promise.resolve({}),
  fetchCart: () => Promise.resolve({ items: [{ productName: 'Item 1' }, { productName: 'Item 2' }] }),
}));
vi.mock('@/api/states', () => ({
  fetchStates: () => Promise.resolve([{ label: 'State A', value: 'a' }, { label: 'State B', value: 'b' }]),
  getStates: () => Promise.resolve([{ label: 'State A', value: 'a' }, { label: 'State B', value: 'b' }]),
}));

import React from 'react';
import { renderWithProviders, screen } from '../test-utils.jsx';
import Dashboard from './dashboard';

describe('Dashboard page', () => {
  it('renders Annual Target, Total Earnings, and Overview cards', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Annual Target')).toBeInTheDocument();
    expect(screen.getByText('Total Earnings')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });
});