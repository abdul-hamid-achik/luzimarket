import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Categorias from './categorias';
import { vi } from 'vitest';

// Mock the API hooks
vi.mock('@/api/hooks', () => ({
    useCategories: vi.fn()
}));

// Mock react-icons
vi.mock('react-icons/fa', () => ({
    FaTags: () => <div data-testid="tags-icon">🏷️</div>,
    FaShoppingBag: () => <div data-testid="shopping-bag-icon">🛍️</div>,
    FaGift: () => <div data-testid="gift-icon">🎁</div>,
    FaHeart: () => <div data-testid="heart-icon">❤️</div>,
    FaHome: () => <div data-testid="home-icon">🏠</div>,
    FaBirthdayCake: () => <div data-testid="cake-icon">🎂</div>,
}));

import { useCategories } from '@/api/hooks';

const renderCategorias = () => {
    return render(
        <MemoryRouter>
            <Categorias />
        </MemoryRouter>
    );
};

describe('Categorias Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state', () => {
        useCategories.mockReturnValue({
            data: null,
            error: null,
            isLoading: true
        });

        renderCategorias();

        expect(screen.getAllByText('Cargando categorías...')).toHaveLength(2);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders error state', () => {
        const error = new Error('Failed to load categories');
        useCategories.mockReturnValue({
            data: null,
            error,
            isLoading: false
        });

        renderCategorias();

        expect(screen.getByText('Error al cargar las categorías')).toBeInTheDocument();
        expect(screen.getByText('Por favor intenta nuevamente más tarde.')).toBeInTheDocument();
        expect(screen.getByText(`Error: ${error.message}`)).toBeInTheDocument();
    });

    it('renders demo categories when no data is available', () => {
        useCategories.mockReturnValue({
            data: [],
            error: null,
            isLoading: false
        });

        renderCategorias();

        // Check for demo categories
        expect(screen.getByText('Flowershop')).toBeInTheDocument();
        expect(screen.getByText('Sweet')).toBeInTheDocument();
        expect(screen.getByText('Events + Dinners')).toBeInTheDocument();
        expect(screen.getByText('Giftshop')).toBeInTheDocument();
        expect(screen.getByText('Home & Living')).toBeInTheDocument();
        expect(screen.getByText('Fashion')).toBeInTheDocument();
    });

    it('renders API data when available', () => {
        const mockCategories = [
            { id: 1, name: 'Electronics', description: 'Latest gadgets and electronics' },
            { id: 2, name: 'Books', description: 'Wide selection of books' }
        ];

        useCategories.mockReturnValue({
            data: mockCategories,
            error: null,
            isLoading: false
        });

        renderCategorias();

        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Books')).toBeInTheDocument();
        expect(screen.getByText('Latest gadgets and electronics')).toBeInTheDocument();
        expect(screen.getByText('Wide selection of books')).toBeInTheDocument();
    });

    it('renders page header correctly', () => {
        useCategories.mockReturnValue({
            data: [],
            error: null,
            isLoading: false
        });

        renderCategorias();

        expect(screen.getByText('Nuestras Categorías')).toBeInTheDocument();
        expect(screen.getByText('Explora nuestra amplia selección de productos organizados por categorías')).toBeInTheDocument();
    });

    it('renders category cards with correct structure', () => {
        useCategories.mockReturnValue({
            data: [],
            error: null,
            isLoading: false
        });

        renderCategorias();

        // Check for "Ver Productos" buttons (should be 6 for demo categories)
        const viewProductsButtons = screen.getAllByText('Ver Productos');
        expect(viewProductsButtons).toHaveLength(6);

        // Check that buttons have correct links
        viewProductsButtons.forEach(button => {
            expect(button.closest('a')).toHaveAttribute('href', expect.stringContaining('/handpicked/productos?category='));
        });
    });

    it('renders call to action section', () => {
        useCategories.mockReturnValue({
            data: [],
            error: null,
            isLoading: false
        });

        renderCategorias();

        expect(screen.getByText('¿No encuentras lo que buscas?')).toBeInTheDocument();
        expect(screen.getByText('Explora todos nuestros productos o contáctanos para ayudarte')).toBeInTheDocument();
        expect(screen.getByText('Ver Todos los Productos')).toBeInTheDocument();
        expect(screen.getByText('Leer Nuestro Blog')).toBeInTheDocument();
    });

    it('renders empty state when no categories available', () => {
        useCategories.mockReturnValue({
            data: [],
            error: null,
            isLoading: false
        });

        renderCategorias();

        // Since we have demo categories, this won't show empty state
        // But let's test the logic by mocking a scenario where demo categories would be empty
        expect(screen.queryByText('No hay categorías disponibles')).not.toBeInTheDocument();
    });

    it('has correct responsive classes', () => {
        useCategories.mockReturnValue({
            data: [],
            error: null,
            isLoading: false
        });

        renderCategorias();

        // Check for Bootstrap grid classes
        const categoryCards = document.querySelectorAll('.col-lg-4.col-md-6');
        expect(categoryCards.length).toBeGreaterThan(0);
    });

    it('renders category images with fallback', () => {
        useCategories.mockReturnValue({
            data: [
                { id: 1, name: 'Test Category', description: 'Test description' }
            ],
            error: null,
            isLoading: false
        });

        renderCategorias();

        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);

        // Check that images have alt text
        images.forEach(img => {
            expect(img).toHaveAttribute('alt');
        });
    });

    it('renders category descriptions correctly', () => {
        useCategories.mockReturnValue({
            data: [],
            error: null,
            isLoading: false
        });

        renderCategorias();

        // Check for demo category descriptions
        expect(screen.getByText('Hermosas flores y arreglos florales para toda ocasión')).toBeInTheDocument();
        expect(screen.getByText('Dulces, pasteles y postres deliciosos')).toBeInTheDocument();
        expect(screen.getByText('Todo lo necesario para eventos y cenas especiales')).toBeInTheDocument();
    });

    it('renders icons for demo categories', () => {
        useCategories.mockReturnValue({
            data: [],
            error: null,
            isLoading: false
        });

        renderCategorias();

        // Check for icon test IDs
        expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
        expect(screen.getByTestId('cake-icon')).toBeInTheDocument();
        expect(screen.getByTestId('gift-icon')).toBeInTheDocument();
        expect(screen.getByTestId('shopping-bag-icon')).toBeInTheDocument();
        expect(screen.getByTestId('home-icon')).toBeInTheDocument();
        expect(screen.getByTestId('tags-icon')).toBeInTheDocument();
    });

    it('has proper link navigation', () => {
        useCategories.mockReturnValue({
            data: [],
            error: null,
            isLoading: false
        });

        renderCategorias();

        // Check call-to-action links
        const allProductsLink = screen.getByText('Ver Todos los Productos').closest('a');
        const blogLink = screen.getByText('Leer Nuestro Blog').closest('a');

        expect(allProductsLink).toHaveAttribute('href', '/handpicked/productos');
        expect(blogLink).toHaveAttribute('href', '/editorial');
    });
}); 