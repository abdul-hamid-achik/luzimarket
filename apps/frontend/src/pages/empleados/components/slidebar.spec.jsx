import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './slidebar';

const renderSidebar = () => {
    return render(
        <MemoryRouter>
            <Sidebar />
        </MemoryRouter>
    );
};

describe('Employee Sidebar', () => {
    it('renders all navigation links', () => {
        renderSidebar();

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Alertas')).toBeInTheDocument();
        expect(screen.getByText('Productos')).toBeInTheDocument();
        expect(screen.getByText('Envíos')).toBeInTheDocument();
        expect(screen.getByText('Dinero')).toBeInTheDocument();
        expect(screen.getByText('Horarios')).toBeInTheDocument();
    });

    it('has correct navigation links', () => {
        renderSidebar();

        const dashboardLink = screen.getByText('Dashboard').closest('a');
        const alertasLink = screen.getByText('Alertas').closest('a');
        const productosLink = screen.getByText('Productos').closest('a');
        const enviosLink = screen.getByText('Envíos').closest('a');
        const dineroLink = screen.getByText('Dinero').closest('a');
        const horariosLink = screen.getByText('Horarios').closest('a');

        expect(dashboardLink).toHaveAttribute('href', '/InicioEmpleados/DashboardEmpleados');
        expect(alertasLink).toHaveAttribute('href', '/InicioEmpleados/AlertasEmpleados');
        expect(productosLink).toHaveAttribute('href', '/InicioEmpleados/Productos');
        expect(enviosLink).toHaveAttribute('href', '/InicioEmpleados/Envios');
        expect(dineroLink).toHaveAttribute('href', '/InicioEmpleados/Dinero');
        expect(horariosLink).toHaveAttribute('href', '/InicioEmpleados/Horarios');
    });

    it('has proper CSS classes for styling', () => {
        renderSidebar();

        const sidebar = document.querySelector('.sidebar');
        expect(sidebar).toHaveClass('overflow-hidden');

        const navList = document.querySelector('.nav.nav-pills.flex-column.mb-auto');
        expect(navList).toBeInTheDocument();

        const navItems = document.querySelectorAll('.nav-item.mb-3');
        expect(navItems).toHaveLength(6);
    });

    it('all links have correct CSS classes', () => {
        renderSidebar();

        const links = screen.getAllByRole('link');
        links.forEach(link => {
            expect(link).toHaveClass('nav-link', 'link-body-emphasis');
        });
    });

    it('renders in correct order', () => {
        renderSidebar();

        const links = screen.getAllByRole('link');
        const linkTexts = links.map(link => link.textContent);

        expect(linkTexts).toEqual([
            'Dashboard',
            'Alertas',
            'Productos',
            'Envíos',
            'Dinero',
            'Horarios'
        ]);
    });

    it('has no broken links (no # hrefs)', () => {
        renderSidebar();

        const links = screen.getAllByRole('link');
        links.forEach(link => {
            expect(link.getAttribute('href')).not.toBe('#');
            expect(link.getAttribute('href')).not.toBe('');
            expect(link.getAttribute('href')).toBeTruthy();
        });
    });

    it('has proper Bootstrap structure', () => {
        renderSidebar();

        expect(document.querySelector('.d-flex.flex-nowrap')).toBeInTheDocument();
        expect(document.querySelector('.d-flex.flex-column.flex-shrink-0.p-3.bg-body-tertiary')).toBeInTheDocument();
    });
}); 