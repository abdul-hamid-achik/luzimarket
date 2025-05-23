import React from 'react';
import { renderWithProviders, screen, within } from '@/test-utils';
import Sidebar from '@/components/slidebar';

describe('Sidebar', () => {
    it('renders navigation links with correct hrefs', () => {
        const { container } = renderWithProviders(<Sidebar />);

        // Find links within the sidebar container only
        const links = within(container).getAllByRole('link');
        expect(links).toHaveLength(5);

        expect(within(container).getByText('Dashboard')).toHaveAttribute('href', '/inicio/dashboard');
        expect(within(container).getByText('Peticiones')).toHaveAttribute('href', '/inicio/peticiones');
        expect(within(container).getByText('Ventas')).toHaveAttribute('href', '/inicio/ventas');
        expect(within(container).getByText('Categorias')).toHaveAttribute('href', '/inicio/categorias');
        expect(within(container).getByText('Locaciones')).toHaveAttribute('href', '/inicio/locaciones');
    });
}); 