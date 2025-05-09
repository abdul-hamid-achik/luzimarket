import React from 'react';
import { renderWithProviders, screen } from '@/test-utils';
import CategoryItem from '@/components/categorias/cat_item';
import { FaTags } from 'react-icons/fa';

describe('CategoryItem', () => {
    it('renders icon and title correctly', () => {
        const icon = <FaTags data-testid="icon" />;
        renderWithProviders(<CategoryItem icon={icon} title="Test Category" />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
        expect(screen.getByText('Test Category')).toBeInTheDocument();
    });
}); 