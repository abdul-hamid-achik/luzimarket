import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BestSellersSection from './best_sellers_section';

// Mock the hooks
vi.mock('@/api/hooks', () => ({
    useBestSellers: vi.fn()
}));

// Mock the card component
vi.mock('./best_sellers_card', () => ({
    default: ({ product, rank }) => (
        <div data-testid={`product-${product.id}`}>
            <span>{product.name}</span>
            <span>Rank: {rank}</span>
        </div>
    )
}));

// Mock CSS imports
vi.mock('./best_sellers_section.css', () => ({}));

import { useBestSellers } from '@/api/hooks';

const mockProducts = [
    {
        id: '1',
        slug: 'ramo-rosas',
        name: 'Ramo de Rosas',
        description: 'Hermoso ramo de rosas frescas',
        price: 75000,
        imageUrl: 'https://blob.vercel-storage.com/roses.jpg',
        imageAlt: 'Ramo de rosas',
        totalSold: 25,
        categoryName: 'Flores'
    },
    {
        id: '2',
        slug: 'chocolates',
        name: 'Chocolates Gourmet',
        description: 'Deliciosos chocolates premium',
        price: 45000,
        imageUrl: 'https://blob.vercel-storage.com/chocolates.jpg',
        imageAlt: 'Chocolates',
        totalSold: 18,
        categoryName: 'Dulces'
    }
];

const renderWithProviders = (component) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {component}
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('BestSellersSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state correctly', () => {
        vi.mocked(useBestSellers).mockReturnValue({
            data: [],
            isLoading: true,
            error: null
        });

        renderWithProviders(<BestSellersSection />);

        expect(screen.getByText('Los Más Vendidos')).toBeInTheDocument();
        expect(screen.getByText('Los productos favoritos de nuestros clientes')).toBeInTheDocument();

        // Should show loading cards
        const loadingCards = screen.getAllByRole('generic').filter(el =>
            el.classList.contains('loading-card')
        );
        expect(loadingCards.length).toBeGreaterThan(0);
    });

    it('renders error state correctly', () => {
        vi.mocked(useBestSellers).mockReturnValue({
            data: [],
            isLoading: false,
            error: new Error('Network error')
        });

        renderWithProviders(<BestSellersSection />);

        expect(screen.getByText('No pudimos cargar los productos más vendidos')).toBeInTheDocument();
        expect(screen.getByText('Por favor, intenta nuevamente en unos momentos')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    it('renders products successfully', () => {
        vi.mocked(useBestSellers).mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<BestSellersSection />);

        expect(screen.getByText('🏆')).toBeInTheDocument();
        expect(screen.getByText('Los Más Vendidos')).toBeInTheDocument();
        expect(screen.getByText('Los productos favoritos de nuestros clientes - ¡No te los pierdas!')).toBeInTheDocument();
        expect(screen.getByText('Top 10')).toBeInTheDocument();

        // Should render product cards
        expect(screen.getByTestId('product-1')).toBeInTheDocument();
        expect(screen.getByTestId('product-2')).toBeInTheDocument();

        // Should show correct product names and ranks
        expect(screen.getByText('Ramo de Rosas')).toBeInTheDocument();
        expect(screen.getByText('Chocolates Gourmet')).toBeInTheDocument();
        expect(screen.getByText('Rank: 1')).toBeInTheDocument();
        expect(screen.getByText('Rank: 2')).toBeInTheDocument();
    });

    it('handles empty products list', () => {
        vi.mocked(useBestSellers).mockReturnValue({
            data: [],
            isLoading: false,
            error: null
        });

        renderWithProviders(<BestSellersSection />);

        expect(screen.getByText('Próximamente')).toBeInTheDocument();
        expect(screen.getByText('Estamos preparando una selección increíble de productos para ti')).toBeInTheDocument();
        expect(screen.getByText('📦')).toBeInTheDocument();
    });

    it('limits products to top 10', () => {
        const manyProducts = Array.from({ length: 15 }, (_, i) => ({
            id: `${i + 1}`,
            slug: `product-${i + 1}`,
            name: `Product ${i + 1}`,
            description: `Description ${i + 1}`,
            price: 50000,
            imageUrl: '',
            imageAlt: '',
            totalSold: 20 - i,
            categoryName: 'Category'
        }));

        vi.mocked(useBestSellers).mockReturnValue({
            data: manyProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<BestSellersSection />);

        // Should only render first 10 products
        expect(screen.getByTestId('product-1')).toBeInTheDocument();
        expect(screen.getByTestId('product-10')).toBeInTheDocument();
        expect(screen.queryByTestId('product-11')).not.toBeInTheDocument();
    });

    it('handles retry button click', () => {
        // Mock window.location.reload properly
        const originalReload = window.location.reload;
        const reloadSpy = vi.fn();

        // Replace the reload function instead of spying on it
        Object.defineProperty(window.location, 'reload', {
            value: reloadSpy,
            writable: true,
            configurable: true
        });

        vi.mocked(useBestSellers).mockReturnValue({
            data: [],
            isLoading: false,
            error: new Error('Network error')
        });

        renderWithProviders(<BestSellersSection />);

        const retryButton = screen.getByRole('button', { name: /reintentar/i });
        fireEvent.click(retryButton);

        expect(reloadSpy).toHaveBeenCalledTimes(1);

        // Restore original function
        Object.defineProperty(window.location, 'reload', {
            value: originalReload,
            writable: true,
            configurable: true
        });
    });

    it('renders section with correct styling classes', () => {
        vi.mocked(useBestSellers).mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<BestSellersSection />);

        const section = screen.getByText('Los Más Vendidos').closest('.best-sellers-section');
        expect(section).toHaveClass('best-sellers-section');

        const grid = section.querySelector('.best-sellers-grid');
        expect(grid).toBeInTheDocument();
    });

    it('shows proper header with stats badge', () => {
        vi.mocked(useBestSellers).mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<BestSellersSection />);

        expect(screen.getByText('Top 10')).toBeInTheDocument();

        const statsBadge = screen.getByText('Top 10');
        expect(statsBadge).toHaveClass('stats-badge');
    });

    it('handles undefined data gracefully', () => {
        vi.mocked(useBestSellers).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null
        });

        renderWithProviders(<BestSellersSection />);

        // Should show empty state
        expect(screen.getByText('Próximamente')).toBeInTheDocument();
    });
}); 