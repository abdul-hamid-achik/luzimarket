import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach } from 'vitest';
import Sidebar from './slidebar';

afterEach(() => {
    cleanup();
});

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

        const dashboardLinks = screen.getAllByText('Dashboard');
        const alertasLinks = screen.getAllByText('Alertas');
        const productosLinks = screen.getAllByText('Productos');
        const enviosLinks = screen.getAllByText('Envíos');
        const dineroLinks = screen.getAllByText('Dinero');
        const horariosLinks = screen.getAllByText('Horarios');

        const dashboardLink = dashboardLinks.find(link => link.closest('a')?.getAttribute('href') === '/dashboard')?.closest('a');
        const alertasLink = alertasLinks.find(link => link.closest('a')?.getAttribute('href') === '/dashboard/alertas')?.closest('a');
        const productosLink = productosLinks.find(link => link.closest('a')?.getAttribute('href') === '/dashboard/productos')?.closest('a');
        const enviosLink = enviosLinks.find(link => link.closest('a')?.getAttribute('href') === '/dashboard/envios')?.closest('a');
        const dineroLink = dineroLinks.find(link => link.closest('a')?.getAttribute('href') === '/dashboard/dinero')?.closest('a');
        const horariosLink = horariosLinks.find(link => link.closest('a')?.getAttribute('href') === '/dashboard/horarios')?.closest('a');

        expect(dashboardLink).toHaveAttribute('href', '/dashboard');
        expect(alertasLink).toHaveAttribute('href', '/dashboard/alertas');
        expect(productosLink).toHaveAttribute('href', '/dashboard/productos');
        expect(enviosLink).toHaveAttribute('href', '/dashboard/envios');
        expect(dineroLink).toHaveAttribute('href', '/dashboard/dinero');
        expect(horariosLink).toHaveAttribute('href', '/dashboard/horarios');
    });

    it('has proper CSS classes for styling', () => {
        renderSidebar();

        const sidebar = document.querySelector('.sidebar');
        expect(sidebar).toHaveClass('overflow-hidden');

        const navList = document.querySelector('.nav.nav-pills.flex-column.mb-auto');
        expect(navList).toBeInTheDocument();

        const sidebarContainer = document.querySelector('.sidebar');
        const navItems = sidebarContainer?.querySelectorAll('.nav-item.mb-3') || [];
        expect(navItems).toHaveLength(6);
    });

    it('all links have correct CSS classes', () => {
        renderSidebar();

        const sidebarContainer = document.querySelector('.sidebar');
        const sidebarLinks = sidebarContainer?.querySelectorAll('a.nav-link') || [];

        Array.from(sidebarLinks).forEach(link => {
            expect(link).toHaveClass('nav-link', 'link-body-emphasis');
        });
    });

    it('renders in correct order', () => {
        renderSidebar();

        const sidebarContainer = document.querySelector('.sidebar');
        const sidebarLinks = sidebarContainer?.querySelectorAll('a.nav-link') || [];
        const linkTexts = Array.from(sidebarLinks).map(link => link.textContent);

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

        const sidebarContainer = document.querySelector('.sidebar');
        const sidebarLinks = sidebarContainer?.querySelectorAll('a.nav-link') || [];

        Array.from(sidebarLinks).forEach(link => {
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