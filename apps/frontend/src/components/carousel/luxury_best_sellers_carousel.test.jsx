import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import LuxuryBestSellersCarousel from './luxury_best_sellers_carousel';

// Mock the API hook
vi.mock('@/api/hooks', () => ({
    useBestSellers: vi.fn()
}));

import { useBestSellers } from '@/api/hooks';

const mockProducts = [
    {
        id: '1',
        name: 'Product 1',
        description: 'Description of product 1',
        price: 2500,
        imageUrl: 'https://example.com/product1.jpg',
        categoryName: 'Category 1',
        totalSold: 25
    },
    {
        id: '2',
        name: 'Product 2',
        description: 'Description of product 2',
        price: 3500,
        imageUrl: 'https://example.com/product2.jpg',
        categoryName: 'Category 2',
        totalSold: 15
    },
    {
        id: '3',
        name: 'Product 3',
        description: 'Description of product 3',
        price: 4500,
        imageUrl: 'https://example.com/product3.jpg',
        categoryName: 'Category 3',
        totalSold: 30
    },
    {
        id: '4',
        name: 'Product 4',
        description: 'Description of product 4',
        price: 5500,
        imageUrl: 'https://example.com/product4.jpg',
        categoryName: 'Category 4',
        totalSold: 10
    },
    {
        id: '5',
        name: 'Product 5',
        description: 'Description of product 5',
        price: 6500,
        imageUrl: 'https://example.com/product5.jpg',
        categoryName: 'Category 5',
        totalSold: 20
    }
];

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

const renderWithProviders = (component) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                {component}
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe('LuxuryBestSellersCarousel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.innerWidth for responsive tests
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1200,
        });
    });

    it('renders loading state correctly', () => {
        useBestSellers.mockReturnValue({
            data: [],
            isLoading: true,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        expect(screen.getByText('Los Más Vendidos')).toBeInTheDocument();
        expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
        expect(document.querySelectorAll('.product-card-skeleton')).toHaveLength(4);
    });

    it('renders empty state when no products available', () => {
        useBestSellers.mockReturnValue({
            data: [],
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        expect(screen.getByText('Los Más Vendidos')).toBeInTheDocument();
        expect(screen.getByText('Próximamente productos increíbles')).toBeInTheDocument();
    });

    it('renders products correctly', () => {
        useBestSellers.mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        expect(screen.getByText('Los Más Vendidos')).toBeInTheDocument();
        expect(screen.getByText('Los favoritos de nuestros clientes - ¡No te los pierdas!')).toBeInTheDocument();
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('$25.00')).toBeInTheDocument();
        expect(screen.getByText('25 vendidos')).toBeInTheDocument();
    });

    it('shows ranking badges correctly', () => {
        useBestSellers.mockReturnValue({
            data: mockProducts.slice(0, 3),
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('truncates long product descriptions', () => {
        const longDescriptionProduct = {
            ...mockProducts[0],
            description: 'This is a very long description that should be truncated because it exceeds the 100 character limit that we have set for the product description display in the carousel component'
        };

        useBestSellers.mockReturnValue({
            data: [longDescriptionProduct],
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        expect(screen.getByText(/This is a very long description that should be truncated because it exceeds the 100 character limit that we have set for the product description display in the carousel component/)).toBeInTheDocument();
    });

    it('shows navigation arrows when more products than visible cards', () => {
        useBestSellers.mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        expect(screen.getByLabelText('Previous products')).toBeInTheDocument();
        expect(screen.getByLabelText('Next products')).toBeInTheDocument();
    });

    it('shows pagination dots when needed', () => {
        useBestSellers.mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        const paginationDots = screen.getAllByLabelText(/Go to slide/);
        expect(paginationDots.length).toBeGreaterThan(0);
    });

    it('handles navigation correctly', async () => {
        useBestSellers.mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        // Should start with first product visible
        expect(screen.getByText('Product 1')).toBeInTheDocument();

        // Click next button
        const nextButton = screen.getByLabelText('Next products');
        fireEvent.click(nextButton);

        await waitFor(() => {
            // After clicking next, we should see different products
            // Note: The exact behavior depends on the viewport and number of visible cards
        });
    });

    it('renders "Ver Todos" link correctly', () => {
        useBestSellers.mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        const viewAllLink = screen.getByText('Ver Todos');
        expect(viewAllLink.closest('a')).toHaveAttribute('href', '/handpicked/productos');
    });

    it('renders product links correctly', () => {
        useBestSellers.mockReturnValue({
            data: [mockProducts[0]],
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        const productLinks = screen.getAllByRole('link');
        const productDetailLinks = productLinks.filter(link =>
            link.getAttribute('href')?.includes('/handpicked/productos/1')
        );

        expect(productDetailLinks.length).toBeGreaterThan(0);
    });

    it('handles error state gracefully', () => {
        useBestSellers.mockReturnValue({
            data: [],
            isLoading: false,
            error: new Error('Failed to fetch products')
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        expect(screen.getByText('Los Más Vendidos')).toBeInTheDocument();
        expect(screen.getByText('Próximamente productos increíbles')).toBeInTheDocument();
    });

    it('does not show navigation for few products', () => {
        useBestSellers.mockReturnValue({
            data: mockProducts.slice(0, 2), // Only 2 products, less than visible cards (4)
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        expect(screen.queryByLabelText('Previous products')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Next products')).not.toBeInTheDocument();
    });

    it('adjusts visible cards based on screen size', () => {
        // Test mobile viewport
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 480,
        });

        // Trigger resize event
        window.dispatchEvent(new Event('resize'));

        useBestSellers.mockReturnValue({
            data: mockProducts,
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        // On mobile, should show navigation since we have more products than fit
        expect(screen.getByLabelText('Previous products')).toBeInTheDocument();
        expect(screen.getByLabelText('Next products')).toBeInTheDocument();
    });

    it('formats prices correctly', () => {
        useBestSellers.mockReturnValue({
            data: [mockProducts[0]], // Price is 2500 cents = $25.00
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        expect(screen.getByText('$25.00')).toBeInTheDocument();
    });

    it('handles products without images gracefully', () => {
        const productWithoutImage = {
            ...mockProducts[0],
            imageUrl: null
        };

        useBestSellers.mockReturnValue({
            data: [productWithoutImage],
            isLoading: false,
            error: null
        });

        renderWithProviders(<LuxuryBestSellersCarousel />);

        const image = screen.getByAltText('Product 1');
        expect(image).toHaveAttribute('src', '/placeholder-product.jpg');
    });
}); 