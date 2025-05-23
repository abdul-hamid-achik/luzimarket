import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dinero from './dinero';
import { vi, afterEach } from 'vitest';

// Mock the breadcrumb component
vi.mock('@/components/breadcrumb', () => ({
    default: ({ items, activeItem }) => (
        <div data-testid="breadcrumb">
            <span data-testid="breadcrumb-active">{activeItem}</span>
        </div>
    )
}));

// Mock react-icons
vi.mock('react-icons/bs', () => ({
    BsCurrencyDollar: () => <div data-testid="currency-icon">$</div>,
    BsGraphUp: () => <div data-testid="graph-icon">📈</div>,
    BsWallet: () => <div data-testid="wallet-icon">👛</div>,
    BsCreditCard: () => <div data-testid="credit-card-icon">💳</div>,
}));

// Cleanup after each test
afterEach(() => {
    cleanup();
});

const renderDinero = () => {
    return render(
        <MemoryRouter>
            <Dinero />
        </MemoryRouter>
    );
};

describe('Dinero Page', () => {
    it('renders the page with breadcrumb', () => {
        renderDinero();
        expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
        expect(screen.getByTestId('breadcrumb-active')).toHaveTextContent('Dinero');
    });

    it('displays financial overview cards', () => {
        renderDinero();

        // Check for all financial cards
        expect(screen.getByText('Ventas Totales')).toBeInTheDocument();
        expect(screen.getByText('Comisiones')).toBeInTheDocument();
        expect(screen.getByText('Pagos Pendientes')).toBeInTheDocument();
        expect(screen.getByText('Crecimiento')).toBeInTheDocument();

        // Check for financial values
        expect(screen.getByText('$45,250')).toBeInTheDocument();
        expect(screen.getByText('$2,262.5')).toBeInTheDocument();
        expect(screen.getByText('$1,850')).toBeInTheDocument();
        expect(screen.getByText('+12.5%')).toBeInTheDocument();
    });

    it('displays period selector with correct default selection', () => {
        renderDinero();

        const weekButton = screen.getByRole('button', { name: 'Semana' });
        const monthButton = screen.getByRole('button', { name: 'Mes' });
        const yearButton = screen.getByRole('button', { name: 'Año' });

        expect(weekButton).toBeInTheDocument();
        expect(monthButton).toBeInTheDocument();
        expect(yearButton).toBeInTheDocument();

        // Month should be selected by default
        expect(monthButton).toHaveClass('btn-primary');
        expect(weekButton).toHaveClass('btn-outline-primary');
        expect(yearButton).toHaveClass('btn-outline-primary');
    });

    it('changes period selection when buttons are clicked', () => {
        renderDinero();

        const weekButton = screen.getByRole('button', { name: 'Semana' });
        const monthButton = screen.getByRole('button', { name: 'Mes' });

        // Click week button
        fireEvent.click(weekButton);

        expect(weekButton).toHaveClass('btn-primary');
        expect(monthButton).toHaveClass('btn-outline-primary');
    });

    it('displays financial summary section', () => {
        renderDinero();

        expect(screen.getByText('Resumen Financiero')).toBeInTheDocument();
        expect(screen.getByText('Transacciones Completadas')).toBeInTheDocument();
        expect(screen.getByText('127')).toBeInTheDocument();
        expect(screen.getByText('Promedio por Transacción')).toBeInTheDocument();
        expect(screen.getByText('$356.30')).toBeInTheDocument();
    });

    it('displays recent transactions table', () => {
        renderDinero();

        expect(screen.getByText('Transacciones Recientes')).toBeInTheDocument();

        // Check table headers using more specific queries
        expect(screen.getByRole('columnheader', { name: 'Fecha' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Tipo' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Monto' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();

        // Check for transaction data
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
        expect(screen.getByText('$250.00')).toBeInTheDocument();
        expect(screen.getAllByText('Venta')).toHaveLength(3);
        expect(screen.getAllByText('Completado')).toHaveLength(4);
    });

    it('displays action buttons', () => {
        renderDinero();

        expect(screen.getByRole('button', { name: 'Exportar Reporte' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Solicitar Pago' })).toBeInTheDocument();
    });

    it('displays all transaction types and statuses correctly', () => {
        renderDinero();

        // Check for different transaction types
        expect(screen.getAllByText('Venta')).toHaveLength(3); // 3 sales transactions
        expect(screen.getAllByText('Comisión')).toHaveLength(2); // 2 commission transactions

        // Check for different statuses
        expect(screen.getAllByText('Completado')).toHaveLength(4); // 4 completed transactions
        expect(screen.getAllByText('Pendiente')).toHaveLength(1); // 1 pending transaction
    });

    it('renders all icons correctly', () => {
        renderDinero();

        expect(screen.getAllByTestId('currency-icon')).toHaveLength(1);
        expect(screen.getAllByTestId('wallet-icon')).toHaveLength(1);
        expect(screen.getAllByTestId('credit-card-icon')).toHaveLength(1);
        expect(screen.getAllByTestId('graph-icon')).toHaveLength(1);
    });

    it('has responsive layout classes', () => {
        renderDinero();

        // Check for Bootstrap responsive classes
        const cards = screen.getAllByText('Ventas Totales')[0].closest('.col-md-3');
        expect(cards).toHaveClass('col-md-3');
        expect(cards).toHaveClass('mb-3');
    });

    it('calculates average transaction correctly', () => {
        renderDinero();

        // 45250 / 127 = 356.30
        expect(screen.getAllByText('$356.30')).toHaveLength(1);
    });
}); 