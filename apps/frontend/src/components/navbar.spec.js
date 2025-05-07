import React from 'react';
import { renderWithProviders, screen } from '../test-utils';
import NavbarAdmin from './navbar';

describe('NavbarAdmin', () => {
  it('renders navigation bar with links and images', () => {
    renderWithProviders(<NavbarAdmin />);
    // Navigation role
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    // Brand logo image
    const logo = screen.getByAltText('Logo Empresa');
    expect(logo).toBeInTheDocument();
    // Check presence of link texts in offcanvas menu
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Peticiones')).toBeInTheDocument();
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('Categorias')).toBeInTheDocument();
    expect(screen.getByText('Locaciones')).toBeInTheDocument();
  });
});