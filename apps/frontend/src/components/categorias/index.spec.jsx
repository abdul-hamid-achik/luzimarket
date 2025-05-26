import React from 'react';
import { renderWithProviders, screen } from '@/test-utils';
import CatSlider from './index';
import { vi } from 'vitest';
import * as hooks from '@/api/hooks';

describe('CatSlider component', () => {
    it('shows loading message when loading', () => {
        vi.spyOn(hooks, 'useCategories').mockReturnValue({ data: [], isLoading: true, error: null });
        renderWithProviders(<CatSlider />);
        expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    });

    it('shows error message when error occurs', () => {
        const error = new Error('Failed to load');
        vi.spyOn(hooks, 'useCategories').mockReturnValue({ data: [], isLoading: false, error });
        renderWithProviders(<CatSlider />);
        expect(screen.getByText(`Error loading categories: ${error.message}`)).toBeInTheDocument();
    });

    it('renders a CategoryItem for each category', () => {
        const categories = [
            { id: 1, name: 'Cat1' },
            { id: 2, name: 'Cat2' },
        ];
        vi.spyOn(hooks, 'useCategories').mockReturnValue({ data: categories, isLoading: false, error: null });
        renderWithProviders(<CatSlider />);
        expect(screen.getByText('Cat1')).toBeInTheDocument();
        expect(screen.getByText('Cat2')).toBeInTheDocument();
    });
}); 