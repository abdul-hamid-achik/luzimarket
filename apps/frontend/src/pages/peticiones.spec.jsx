import React from 'react';
import { renderWithProviders, screen, within } from '../test-utils.jsx';
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
    const { container } = renderWithProviders(<Peticiones />);

    expect(within(container).getByTestId('breadcrumb')).toHaveTextContent('Peticiones');

    // Find the specific petition card within the page container
    const card = within(container).getByTestId('petition-card');
    expect(card).toHaveTextContent('Pet A');
    expect(card).toHaveTextContent('Desc A');
    expect(card).toHaveTextContent('2');
    expect(card).toHaveTextContent('Entrar');

    // Find the link within the card
    const link = within(card).getByRole('link', { name: /Entrar/ });
    expect(link).toHaveAttribute('href', '/a');
  });
});