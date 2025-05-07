import React from 'react';
import { renderWithProviders, screen } from '../test-utils';
import Dashboard from './dashboard';

describe('Dashboard page', () => {
  it('renders Annual Target, Total Earnings, and Overview cards', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Annual Target')).toBeInTheDocument();
    expect(screen.getByText('Total Earnings')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });
});