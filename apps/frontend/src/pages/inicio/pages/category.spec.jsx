import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import CategoryPage from './category';

// Mock the API hooks
vi.mock('@/api/hooks', () => ({
    useCategoryBySlug: vi.fn(),
    useProducts: vi.fn(),
    useAddToCart: vi.fn()
}));

// Mock react-icons
vi.mock('react-icons/fa', () => ({
    FaHome: () => <div data-testid="home-icon">🏠</div>,
    FaTags: () => <div data-testid="tags-icon">🏷️</div>,
    FaArrowLeft: () => <div data-testid="arrow-left-icon">←</div>
}));

// Mock CSS imports
vi.mock('@/pages/inicio/css/handpicked.css', () => ({}));
vi.mock('@/pages/inicio/css/category.css', () => ({}));

import { useCategoryBySlug, useProducts, useAddToCart } from '@/api/hooks';

// Create a wrapper component with React Router and React Query
const createWrapper = (initialEntries = ['/categorias/test-category']) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

    return ({ children }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="/categorias/:slug" element={children} />
                    <Route path="/" element={<div>Home Page</div>} />
                    <Route path="/categorias" element={<div>Categories Page</div>} />
                    <Route path="/handpicked/productos" element={<div>Products Page</div>} />
                    <Route path="/handpicked/productos/:id" element={<div>Product Details</div>} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
};

const renderCategoryPage = (initialEntries) => {
    const Wrapper = createWrapper(initialEntries);
    return render(<CategoryPage />, { wrapper: Wrapper });
};

describe('CategoryPage', () => {
    const mockAddToCart = {
        mutate: vi.fn(),
        isLoading: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useAddToCart.mockReturnValue(mockAddToCart);
    });

    describe('Loading States', () => {
        it('renders category loading state', () => {
            useCategoryBySlug.mockReturnValue({
                data: null,
                isLoading: true,
                error: null
            });
            useProducts.mockReturnValue({
                data: null,
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            expect(screen.getAllByText('Cargando categoría...')).toHaveLength(2);
            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('renders products loading state after category loads', () => {
            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category', description: 'Test Description' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: null,
                isLoading: true,
                error: null
            });

            renderCategoryPage();

            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Category');
            expect(screen.getAllByText('Cargando productos...')).toHaveLength(2);
        });
    });

    describe('Error States', () => {
        it('renders 404 error when category not found', () => {
            useCategoryBySlug.mockReturnValue({
                data: null,
                isLoading: false,
                error: { response: { status: 404 } }
            });
            useProducts.mockReturnValue({
                data: null,
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            expect(screen.getByText('Categoría no encontrada')).toBeInTheDocument();
            expect(screen.getByText('La categoría que buscas no existe o ha sido eliminada.')).toBeInTheDocument();
            expect(screen.getByText('Ir al Inicio')).toBeInTheDocument();
            expect(screen.getByText('Ver Categorías')).toBeInTheDocument();
        });

        it('renders general category error', () => {
            useCategoryBySlug.mockReturnValue({
                data: null,
                isLoading: false,
                error: { response: { status: 500 } }
            });
            useProducts.mockReturnValue({
                data: null,
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            expect(screen.getByText('Error cargando categoría')).toBeInTheDocument();
            expect(screen.getByText('Hubo un problema al cargar la categoría. Por favor intenta de nuevo.')).toBeInTheDocument();
            expect(screen.getByText('Reintentar')).toBeInTheDocument();
        });

        it('renders products error', () => {
            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: null,
                isLoading: false,
                error: new Error('Failed to load products')
            });

            renderCategoryPage();

            expect(screen.getByText('Error cargando productos')).toBeInTheDocument();
            expect(screen.getByText('Hubo un problema al cargar los productos de esta categoría.')).toBeInTheDocument();
        });
    });

    describe('Success States', () => {
        it('renders category with no products', () => {
            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category', description: 'Test Description' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: [] },
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Category');
            expect(screen.getByText('Test Description')).toBeInTheDocument();
            expect(screen.getByText('¡Productos muy pronto!')).toBeInTheDocument();
            expect(screen.getByText(/Estamos preparando productos increíbles para la categoría Test Category/)).toBeInTheDocument();
        });

        it('renders category with products', () => {
            const mockCategory = {
                id: '1',
                name: 'Electronics',
                slug: 'electronics',
                description: 'Latest gadgets and electronics'
            };

            const mockProducts = [
                {
                    id: 'product1',
                    name: 'Smartphone',
                    description: 'Latest smartphone with great features',
                    price: 99900,
                    imageUrl: 'https://example.com/phone.jpg',
                    featured: true
                },
                {
                    id: 'product2',
                    name: 'Laptop',
                    description: 'Powerful laptop for work and gaming',
                    price: 149900,
                    imageUrl: 'https://example.com/laptop.jpg',
                    featured: false
                }
            ];

            useCategoryBySlug.mockReturnValue({
                data: mockCategory,
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: mockProducts },
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            // Check category header
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Electronics');
            expect(screen.getByText('Latest gadgets and electronics')).toBeInTheDocument();

            // Check products count
            expect(screen.getByText(/Mostrando 2 productos/)).toBeInTheDocument();

            // Check products
            expect(screen.getByText('Smartphone')).toBeInTheDocument();
            expect(screen.getByText('Latest smartphone with great features')).toBeInTheDocument();
            expect(screen.getByText('$999.00')).toBeInTheDocument();

            expect(screen.getByText('Laptop')).toBeInTheDocument();
            expect(screen.getByText('Powerful laptop for work and gaming')).toBeInTheDocument();
            expect(screen.getByText('$1499.00')).toBeInTheDocument();

            // Check featured badge
            expect(screen.getByText('⭐ Destacado')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('renders breadcrumb navigation correctly', () => {
            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: [] },
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            expect(screen.getByText('Inicio')).toBeInTheDocument();
            expect(screen.getByText('Categorías')).toBeInTheDocument();
            expect(screen.getByText('Test Category', { selector: '.breadcrumb-item.active' })).toBeInTheDocument();
        });

        it('has correct navigation links', () => {
            const mockProducts = [
                {
                    id: 'product1',
                    name: 'Test Product',
                    description: 'Test description',
                    price: 10000
                }
            ];

            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: mockProducts },
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            // Check product links
            const productLinks = screen.getAllByText('Ver Detalles');
            expect(productLinks).toHaveLength(2); // One in hover overlay, one in button

            // Check footer links
            expect(screen.getByText('Ver Otras Categorías')).toBeInTheDocument();
            expect(screen.getByText('Ver Todos los Productos')).toBeInTheDocument();
        });
    });

    describe('Add to Cart Functionality', () => {
        it('handles add to cart successfully', async () => {
            const mockProducts = [
                {
                    id: 'product1',
                    name: 'Test Product',
                    description: 'Test description',
                    price: 10000
                }
            ];

            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: mockProducts },
                isLoading: false,
                error: null
            });

            const mockMutate = vi.fn((params, { onSuccess }) => {
                onSuccess();
            });
            useAddToCart.mockReturnValue({
                mutate: mockMutate,
                isLoading: false
            });

            renderCategoryPage();

            const addToCartButton = screen.getByText('🛒');
            fireEvent.click(addToCartButton);

            expect(mockMutate).toHaveBeenCalledWith(
                { productId: 'product1', quantity: 1 },
                expect.any(Object)
            );

            await waitFor(() => {
                expect(screen.getByText('¡Agregado al carrito!')).toBeInTheDocument();
            });
        });

        it('shows loading state when adding to cart', () => {
            const mockProducts = [
                {
                    id: 'product1',
                    name: 'Test Product',
                    description: 'Test description',
                    price: 10000
                }
            ];

            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: mockProducts },
                isLoading: false,
                error: null
            });

            useAddToCart.mockReturnValue({
                mutate: vi.fn(),
                isLoading: true
            });

            renderCategoryPage();

            const addToCartButton = screen.getByText('🛒');
            expect(addToCartButton).toBeDisabled();
        });
    });

    describe('Image Handling', () => {
        it('handles image errors gracefully', () => {
            const mockProducts = [
                {
                    id: 'product1',
                    name: 'Test Product',
                    description: 'Test description',
                    price: 10000,
                    imageUrl: 'https://example.com/broken-image.jpg'
                }
            ];

            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: mockProducts },
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            const productImage = screen.getByAltText('Test Product');
            expect(productImage).toBeInTheDocument();

            // Simulate image error
            fireEvent.error(productImage);

            // The image should now have a fallback URL
            expect(productImage.src).toContain('unsplash.com');
        });

        it('uses fallback image when no imageUrl provided', () => {
            const mockProducts = [
                {
                    id: 'product1',
                    name: 'Test Product',
                    description: 'Test description',
                    price: 10000
                }
            ];

            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: mockProducts },
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            const productImage = screen.getByAltText('Test Product');
            expect(productImage.src).toContain('unsplash.com');
        });
    });

    describe('Responsive Design', () => {
        it('applies responsive grid classes', () => {
            const mockProducts = [
                {
                    id: 'product1',
                    name: 'Test Product',
                    description: 'Test description',
                    price: 10000
                }
            ];

            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: mockProducts },
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            const productContainer = screen.getByTestId('product-product1').closest('.col-12');
            expect(productContainer).toHaveClass('col-12', 'col-sm-6', 'col-md-6', 'col-lg-4', 'col-xl-3');
        });
    });

    describe('SEO and Accessibility', () => {
        it('has proper heading structure', () => {
            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Electronics', slug: 'electronics', description: 'Test Description' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: [] },
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toHaveTextContent('Electronics');
        });

        it('has proper alt text for images', () => {
            const mockProducts = [
                {
                    id: 'product1',
                    name: 'Smartphone',
                    description: 'Test description',
                    price: 10000
                }
            ];

            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Test Category', slug: 'test-category' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: mockProducts },
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            const productImage = screen.getByAltText('Smartphone');
            expect(productImage).toBeInTheDocument();
        });

        it('has proper loading states with aria labels', () => {
            useCategoryBySlug.mockReturnValue({
                data: null,
                isLoading: true,
                error: null
            });
            useProducts.mockReturnValue({
                data: null,
                isLoading: false,
                error: null
            });

            renderCategoryPage();

            const loadingSpinner = screen.getByRole('status');
            expect(loadingSpinner).toBeInTheDocument();
            expect(screen.getAllByText('Cargando categoría...')).toHaveLength(2);
        });
    });

    describe('URL Parameter Handling', () => {
        it('handles different category slugs correctly', () => {
            useCategoryBySlug.mockReturnValue({
                data: { id: '1', name: 'Home & Garden', slug: 'home-garden' },
                isLoading: false,
                error: null
            });
            useProducts.mockReturnValue({
                data: { products: [] },
                isLoading: false,
                error: null
            });

            renderCategoryPage(['/categorias/home-garden']);

            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Home & Garden');
        });
    });
}); 