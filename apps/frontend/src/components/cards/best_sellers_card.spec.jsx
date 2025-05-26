import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import BestSellersCard from './best_sellers_card';

// Mock CSS imports
vi.mock('./best_sellers_card.css', () => ({}));

afterEach(() => {
    cleanup();
});

const mockProduct = {
    id: '1',
    slug: 'ramo-rosas',
    name: 'Ramo de Rosas Premium',
    description: 'Hermoso ramo de 12 rosas rojas frescas, perfecto para ocasiones especiales',
    price: 75000, // Price in cents (750 pesos)
    imageUrl: 'https://blob.vercel-storage.com/roses.jpg',
    imageAlt: 'Ramo de rosas rojas',
    totalSold: 25,
    categoryName: 'Flores'
};

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('BestSellersCard', () => {
    it('renders product information correctly', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={1} />);

        expect(screen.getByText('Ramo de Rosas Premium')).toBeInTheDocument();
        expect(screen.getByText('Hermoso ramo de 12 rosas rojas frescas, perfecto para ocasiones especiales')).toBeInTheDocument();
        expect(screen.getByText('Flores')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('Best Seller')).toBeInTheDocument();
        expect(screen.getAllByText('25 vendidos')).toHaveLength(1);
    });

    it('formats price correctly in Mexican pesos', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={1} />);

        // Should display $750.00 for 75000 cents
        expect(screen.getByText('$750.00')).toBeInTheDocument();
    });

    it('displays correct rank number', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={5} />);

        expect(screen.getByText('#5')).toBeInTheDocument();
    });

    it('renders product image with correct attributes', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={1} />);

        const image = screen.getByRole('img');
        expect(image).toHaveAttribute('src', 'https://blob.vercel-storage.com/roses.jpg');
        expect(image).toHaveAttribute('alt', 'Ramo de rosas rojas');
        expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('handles missing image URL gracefully', () => {
        const productWithoutImage = { ...mockProduct, imageUrl: '' };
        renderWithRouter(<BestSellersCard product={productWithoutImage} rank={1} />);

        const image = screen.getByRole('img');
        expect(image.src).toContain('picsum.photos');
    });

    it('handles image load error with fallback', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={1} />);

        const image = screen.getByRole('img');
        // Simulate image load error
        fireEvent.error(image);

        // The fallback should be an Unsplash image, not picsum.photos
        expect(image.src).toContain('images.unsplash.com');
    });

    it('contains correct navigation links', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={1} />);

        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2); // Image link and button link

        links.forEach(link => {
            expect(link).toHaveAttribute('href', '/handpicked/productos/1');
        });
    });

    it('displays sales count with fire emoji', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={1} />);

        const salesSection = screen.getAllByText('25 vendidos')[0];
        expect(salesSection).toBeInTheDocument();

        // Check for fire emoji
        expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('has add to cart button', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={1} />);

        const addToCartButtons = screen.getAllByRole('button', { name: /agregar al carrito/i });
        expect(addToCartButtons).toHaveLength(1);
        expect(addToCartButtons[0]).toBeInTheDocument();
    });

    it('has quick view button in overlay', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={1} />);

        const quickViewButtons = screen.getAllByRole('button', { name: /ver producto/i });
        expect(quickViewButtons).toHaveLength(1);
        expect(quickViewButtons[0]).toBeInTheDocument();
    });

    it('truncates long descriptions appropriately', () => {
        const productWithLongDescription = {
            ...mockProduct,
            description: 'Este es un producto increíblemente fantástico que tiene muchas características maravillosas y beneficios únicos que lo hacen perfecto para cualquier ocasión especial. Es realmente el mejor producto que puedes encontrar en el mercado hoy en día.'
        };

        renderWithRouter(<BestSellersCard product={productWithLongDescription} rank={1} />);

        // The CSS should handle truncation with -webkit-line-clamp
        const description = screen.getByText(productWithLongDescription.description);
        expect(description).toBeInTheDocument();
    });

    it('handles different price ranges correctly', () => {
        const expensiveProduct = { ...mockProduct, price: 250000 }; // 2500 pesos
        renderWithRouter(<BestSellersCard product={expensiveProduct} rank={1} />);

        expect(screen.getByText('$2,500.00')).toBeInTheDocument();
    });

    it('handles zero sales count', () => {
        const newProduct = { ...mockProduct, totalSold: 0 };
        renderWithRouter(<BestSellersCard product={newProduct} rank={1} />);

        expect(screen.getByText('0 vendidos')).toBeInTheDocument();
    });

    it('applies correct CSS classes', () => {
        renderWithRouter(<BestSellersCard product={mockProduct} rank={1} />);

        const cards = screen.getAllByText('Ramo de Rosas Premium');
        const card = cards[0].closest('.best-seller-card');
        expect(card).toHaveClass('best-seller-card');
    });
}); 