import React from 'react';
import { renderWithProviders, screen } from '@/test-utils';
import RenderSucursales from '@/components/peticiones/sucursales';

describe('Sucursales Component', () => {
    it('renders the card with title and link', () => {
        renderWithProviders(<RenderSucursales />);
        expect(screen.getByText('Sucursales')).toBeInTheDocument();
        const link = screen.getByRole('link', { name: /entrar/i });
        expect(link).toHaveAttribute('href', '/Sucursales');
    });
}); 