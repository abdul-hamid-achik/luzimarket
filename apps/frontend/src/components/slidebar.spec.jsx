import React from 'react';
import { renderWithProviders, screen } from '@/test-utils';
import Sidebar from '@/components/slidebar';

describe('Sidebar', () => {
    it('renders navigation links with correct hrefs', () => {
        renderWithProviders(<Sidebar />);
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(5);
        expect(screen.getByText('Dashboard')).toHaveAttribute('href', '/inicio/dashboard');
        expect(screen.getByText('Peticiones')).toHaveAttribute('href', '/inicio/peticiones');
        expect(screen.getByText('Ventas')).toHaveAttribute('href', '/inicio/ventas');
        expect(screen.getByText('Categorias')).toHaveAttribute('href', '/inicio/categorias');
        expect(screen.getByText('Locaciones')).toHaveAttribute('href', '/inicio/locaciones');
    });
}); 