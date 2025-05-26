import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Handpicked from './hand_picked';
import * as hooks from '@/api/hooks';

// Mock the API hooks
vi.mock('@/api/hooks', () => ({
    useProduct: vi.fn(),
    usePhotos: vi.fn(),
    useAddToCart: vi.fn(),
    useProductDetails: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: 'test-product-id' }),
        Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
    };
});

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                {children}
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe('Product Detail Delivery Zones', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(hooks.usePhotos).mockReturnValue({
            data: [],
            isLoading: false,
            error: null,
        });
        vi.mocked(hooks.useAddToCart).mockReturnValue({
            mutate: vi.fn(),
            isLoading: false,
        });
        vi.mocked(hooks.useProductDetails).mockReturnValue({
            data: [],
            isLoading: false,
            error: null,
        });
    });

    test('should display delivery zone availability when product has delivery info', async () => {
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            description: 'Test Description',
            price: 1999,
            delivery_info: {
                is_available_in_user_zone: true,
                user_delivery_zone: {
                    id: 'zone-1',
                    name: 'CDMX',
                    fee: 500
                },
                available_zones: [
                    { id: 'zone-1', name: 'CDMX', fee: 500 },
                    { id: 'zone-2', name: 'Guadalajara', fee: 750 }
                ]
            }
        };

        vi.mocked(hooks.useProduct).mockReturnValue({
            data: mockProduct,
            isLoading: false,
            error: null,
        });

        render(<Handpicked />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(screen.getByText('Delivery Availability')).toBeInTheDocument();
        });

        expect(screen.getByText(/Available in CDMX/)).toBeInTheDocument();
        expect(screen.getByText(/Delivery fee: \$5.00/)).toBeInTheDocument();
        expect(screen.getByText('Available in these areas:')).toBeInTheDocument();
        expect(screen.getByText(/CDMX \(\$5.00\)/)).toBeInTheDocument();
        expect(screen.getByText(/Guadalajara \(\$7.50\)/)).toBeInTheDocument();
    });

    test('should display not available message when product is not available in user zone', async () => {
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            description: 'Test Description',
            price: 1999,
            delivery_info: {
                is_available_in_user_zone: false,
                user_delivery_zone: {
                    id: 'zone-1',
                    name: 'CDMX',
                    fee: 500
                },
                available_zones: [
                    { id: 'zone-2', name: 'Guadalajara', fee: 750 }
                ]
            }
        };

        vi.mocked(hooks.useProduct).mockReturnValue({
            data: mockProduct,
            isLoading: false,
            error: null,
        });

        render(<Handpicked />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(screen.getByText('Delivery Availability')).toBeInTheDocument();
        });

        expect(screen.getByText(/Not available in CDMX/)).toBeInTheDocument();
        expect(screen.getByText(/Delivery fee: \$5.00/)).toBeInTheDocument();
        expect(screen.getByText('Available in these areas:')).toBeInTheDocument();
        expect(screen.getByText(/Guadalajara \(\$7.50\)/)).toBeInTheDocument();
    });

    test('should display message to select delivery zone when no user zone is set', async () => {
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            description: 'Test Description',
            price: 1999,
            delivery_info: {
                is_available_in_user_zone: false,
                user_delivery_zone: null,
                available_zones: [
                    { id: 'zone-1', name: 'CDMX', fee: 500 },
                    { id: 'zone-2', name: 'Guadalajara', fee: 750 }
                ]
            }
        };

        vi.mocked(hooks.useProduct).mockReturnValue({
            data: mockProduct,
            isLoading: false,
            error: null,
        });

        render(<Handpicked />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(screen.getByText('Delivery Availability')).toBeInTheDocument();
        });

        expect(screen.getByText('Please select your delivery zone to check availability')).toBeInTheDocument();
        expect(screen.getByText('Available in these areas:')).toBeInTheDocument();
        expect(screen.getByText(/CDMX \(\$5.00\)/)).toBeInTheDocument();
        expect(screen.getByText(/Guadalajara \(\$7.50\)/)).toBeInTheDocument();
    });

    test('should not display delivery section when product has no delivery info', async () => {
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            description: 'Test Description',
            price: 1999,
            // No delivery_info property
        };

        vi.mocked(hooks.useProduct).mockReturnValue({
            data: mockProduct,
            isLoading: false,
            error: null,
        });

        render(<Handpicked />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Test Product' })).toBeInTheDocument();
        });

        expect(screen.queryByText('Delivery Availability')).not.toBeInTheDocument();
    });

    test('should handle empty available zones list', async () => {
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            description: 'Test Description',
            price: 1999,
            delivery_info: {
                is_available_in_user_zone: false,
                user_delivery_zone: null,
                available_zones: []
            }
        };

        vi.mocked(hooks.useProduct).mockReturnValue({
            data: mockProduct,
            isLoading: false,
            error: null,
        });

        render(<Handpicked />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(screen.getByText('Delivery Availability')).toBeInTheDocument();
        });

        expect(screen.getByText('Please select your delivery zone to check availability')).toBeInTheDocument();
        expect(screen.queryByText('Available in these areas:')).not.toBeInTheDocument();
    });

    test('should format prices correctly', async () => {
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            description: 'Test Description',
            price: 1999,
            delivery_info: {
                is_available_in_user_zone: true,
                user_delivery_zone: {
                    id: 'zone-1',
                    name: 'CDMX',
                    fee: 1050 // $10.50
                },
                available_zones: [
                    { id: 'zone-1', name: 'CDMX', fee: 1050 },
                    { id: 'zone-2', name: 'Guadalajara', fee: 2500 } // $25.00
                ]
            }
        };

        vi.mocked(hooks.useProduct).mockReturnValue({
            data: mockProduct,
            isLoading: false,
            error: null,
        });

        render(<Handpicked />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(screen.getByText('Delivery Availability')).toBeInTheDocument();
        });

        expect(screen.getByText(/Delivery fee: \$10.50/)).toBeInTheDocument();
        expect(screen.getByText(/CDMX \(\$10.50\)/)).toBeInTheDocument();
        expect(screen.getByText(/Guadalajara \(\$25.00\)/)).toBeInTheDocument();
    });
}); 