import React from 'react';
import { renderWithProviders, screen, waitFor } from '../test-utils';
import { useProducts, useCart, useStates } from './hooks';

// Helper components that consume the hooks
function ProductsComp() {
  const { data, isLoading } = useProducts();
  if (isLoading) return <div>Loading products...</div>;
  return <div>{data.map((p) => p.name).join(',')}</div>;
}

function CartComp() {
  const { data, isLoading } = useCart();
  if (isLoading) return <div>Loading cart...</div>;
  return <div>{data.items.map((i) => i.productName).join(',')}</div>;
}

function StatesComp() {
  const { data, isLoading } = useStates();
  if (isLoading) return <div>Loading states...</div>;
  return <div>{data.map((s) => s.label).join(',')}</div>;
}

describe('React Query hooks', () => {
  it('useProducts fetches and displays product names', async () => {
    renderWithProviders(<ProductsComp />);
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Prod A,Prod B')).toBeInTheDocument());
  });

  it('useCart fetches and displays cart item names', async () => {
    renderWithProviders(<CartComp />);
    expect(screen.getByText('Loading cart...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Prod A')).toBeInTheDocument());
  });

  it('useStates fetches and displays state labels', async () => {
    renderWithProviders(<StatesComp />);
    expect(screen.getByText('Loading states...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('State A,State B')).toBeInTheDocument());
  });
});