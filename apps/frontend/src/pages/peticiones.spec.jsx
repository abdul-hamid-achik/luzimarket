import React from 'react';
import { renderWithProviders, screen } from '../test-utils.jsx';
import Peticiones from './peticiones';
import { vi } from 'vitest';
import * as hooks from '@/api/hooks';

// Mock the petitions hook
describe('Peticiones page', () => {
  beforeEach(() => {
    vi.spyOn(hooks, 'usePetitions').mockReturnValue({
      data: [{ id: 1, title: 'Pet A', description: 'Desc A', badgeCount: 2, link: '/a' }],
      isLoading: false,
      error: null,
    });
  });

  it('renders petition cards', () => {
    renderWithProviders(<Peticiones />);
    expect(screen.getByTestId('breadcrumb')).toHaveTextContent('Peticiones');
    const card = screen.getByTestId('petition-card');
    expect(card).toHaveTextContent('Pet A');
    expect(card).toHaveTextContent('Desc A');
    expect(card).toHaveTextContent('2');
    expect(card).toHaveTextContent('Entrar');
    const link = screen.getByRole('link', { name: /Entrar/ });
    expect(link).toHaveAttribute('href', '/a');
  });
});