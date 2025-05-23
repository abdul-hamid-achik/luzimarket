import React from 'react';
import { renderWithProviders, screen, within } from '@/test-utils';
import RenderSucursales from '@/components/peticiones/sucursales';

describe('Sucursales Component', () => {
    it('renders the card with title and link', () => {
        const { container } = renderWithProviders(<RenderSucursales />);

        // Use data-testid to find the specific card component
        const card = within(container).getByTestId('sucursales-card');
        expect(within(card).getByText('Sucursales')).toBeInTheDocument();

        // Find the link within the card container
        const link = within(card).getByRole('link', { name: /entrar/i });
        expect(link).toHaveAttribute('href', '/Sucursales');
    });
}); 