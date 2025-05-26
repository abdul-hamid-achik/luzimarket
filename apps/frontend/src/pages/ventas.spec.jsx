import React from 'react';
import { renderWithProviders, screen } from '../test-utils.jsx';
import Ventas from './ventas';
import { vi } from 'vitest';

// Ensure date picker and chart mocks do not break tests (setupTests handles these)
describe('Ventas page', () => {
  it('renders order status cards and chart section', () => {
    renderWithProviders(<Ventas />);
    // Check static headings
    expect(screen.getByText('Total de ventas')).toBeInTheDocument();
    expect(screen.getByText('Total de ventas en todas las sucursales.')).toBeInTheDocument();
    // Three status cards: Awaiting processing, On Hold, Out of stock
    expect(screen.getByText('Awaiting processing')).toBeInTheDocument();
    expect(screen.getByText('On Hold')).toBeInTheDocument();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    // Date picker should be present (mocked as div with testid)
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
  });
});