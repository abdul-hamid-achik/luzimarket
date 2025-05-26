import React from 'react';
import { renderWithProviders, screen } from '../test-utils.jsx';
import Categorias from './categorias';
import { vi } from 'vitest';

// Mock the categories hook
import * as hooks from '@/api/hooks';

describe('Categorias page', () => {
  it('shows loading state when loading', () => {
    vi.spyOn(hooks, 'useCategories').mockReturnValue({ data: [], isLoading: true, error: null });
    renderWithProviders(<Categorias />);
    expect(screen.getAllByText('Loading categories...').length).toBeGreaterThan(0);
  });

  it('shows error state when error occurred', () => {
    const error = new Error('fail');
    vi.spyOn(hooks, 'useCategories').mockReturnValue({ data: [], isLoading: false, error });
    renderWithProviders(<Categorias />);
    expect(screen.getAllByText(`Error loading categories: ${error.message}`).length).toBeGreaterThan(0);
  });

  it('renders categories list when data is available', () => {
    vi.spyOn(hooks, 'useCategories').mockReturnValue({ data: [{ id: 1, name: 'Cat A' }], isLoading: false, error: null });
    renderWithProviders(<Categorias />);
    expect(screen.getByText('Cat A')).toBeInTheDocument();
  });
});