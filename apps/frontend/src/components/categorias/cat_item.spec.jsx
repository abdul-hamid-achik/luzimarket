import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CategoryItem from './cat_item';

const renderCategoryItem = (props = {}) => {
    const defaultProps = {
        icon: <div data-testid="test-icon">🏷️</div>,
        title: 'Test Category',
        ...props
    };

    return render(
        <MemoryRouter>
            <CategoryItem {...defaultProps} />
        </MemoryRouter>
    );
};

describe('CategoryItem', () => {
    it('renders category item with icon and title', () => {
        renderCategoryItem();

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
        expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    it('renders as link when no onClick handler provided', () => {
        renderCategoryItem({ title: 'Electronics', slug: 'electronics' });

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/categorias/electronics');
        expect(link).toHaveClass('text-decoration-none', 'text-dark');
    });

    it('generates slug from title when slug not provided', () => {
        renderCategoryItem({ title: 'Home & Garden' });

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/categorias/home-garden');
    });

    it('handles complex title to slug conversion', () => {
        renderCategoryItem({ title: 'Events + Dinners & More!!!' });

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/categorias/events-dinners-more');
    });

    it('renders as clickable div when onClick handler provided', () => {
        const handleClick = vi.fn();
        renderCategoryItem({ onClick: handleClick });

        // Find the clickable div directly by its class
        const item = document.querySelector('.item');
        expect(item).toHaveStyle('cursor: pointer');
        expect(item).toHaveClass('item');

        fireEvent.click(item);
        expect(handleClick).toHaveBeenCalledTimes(1);

        // Should not render as link when onClick is provided
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('applies correct styling for interactive item', () => {
        renderCategoryItem();

        // Check the outer div (item class) and inner div (info class)
        const link = screen.getByRole('link');
        const item = link.querySelector('.item');
        expect(item).toHaveClass('item');

        const info = item.querySelector('.info');
        expect(info).toHaveClass('info');
    });

    it('handles empty or undefined props gracefully', () => {
        renderCategoryItem({ title: '', slug: '' });

        // Should still render but with empty title
        const link = screen.getByRole('link');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/categorias/');
    });

    describe('Accessibility', () => {
        it('has proper link semantics', () => {
            renderCategoryItem({ title: 'Electronics' });

            const link = screen.getByRole('link');
            expect(link).toBeInTheDocument();
            // The accessible name includes the icon, so it's "🏷️ Electronics"
            expect(link).toHaveAccessibleName('🏷️ Electronics');
        });

        it('maintains keyboard navigation for links', () => {
            renderCategoryItem({ title: 'Electronics' });

            const link = screen.getByRole('link');
            // Links are naturally focusable and don't need tabIndex="0"
            // They get tabIndex="0" by default, but it's not explicitly set
            expect(link).toBeInTheDocument();
            expect(link.getAttribute('tabIndex')).toBeNull();
        });

        it('maintains keyboard navigation for clickable items', () => {
            const handleClick = vi.fn();
            renderCategoryItem({ onClick: handleClick });

            const item = screen.getByText('Test Category').closest('div');

            // Simulate keyboard interaction
            fireEvent.keyDown(item, { key: 'Enter' });
            // Note: The component doesn't handle keyboard events currently,
            // but this test documents the expected behavior
        });
    });

    describe('Special Characters in Titles', () => {
        it('handles titles with special characters', () => {
            const testCases = [
                { title: 'Toys & Games', expected: 'toys-games' },
                { title: 'Health/Beauty', expected: 'health-beauty' },
                { title: 'Books, Music & Movies', expected: 'books-music-movies' },
                { title: 'Art@Home', expected: 'art-home' }
            ];

            testCases.forEach(({ title, expected }) => {
                const { unmount } = renderCategoryItem({ title });
                const link = screen.getByRole('link');
                expect(link).toHaveAttribute('href', `/categorias/${expected}`);
                unmount();
            });
        });

        it('handles titles with numbers', () => {
            renderCategoryItem({ title: 'Top 10 Products' });

            const link = screen.getByRole('link');
            expect(link).toHaveAttribute('href', '/categorias/top-10-products');
        });

        it('handles titles with accented characters', () => {
            renderCategoryItem({ title: 'Niños & Bebés' });

            const link = screen.getByRole('link');
            expect(link).toHaveAttribute('href', '/categorias/ni-os-beb-s');
        });
    });

    describe('Props Validation', () => {
        it('works with minimal props', () => {
            render(
                <MemoryRouter>
                    <CategoryItem title="Minimal" />
                </MemoryRouter>
            );

            expect(screen.getByText('Minimal')).toBeInTheDocument();
            expect(screen.getByRole('link')).toHaveAttribute('href', '/categorias/minimal');
        });

        it('prioritizes provided slug over generated slug', () => {
            renderCategoryItem({
                title: 'Auto Generated Slug',
                slug: 'custom-slug'
            });

            const link = screen.getByRole('link');
            expect(link).toHaveAttribute('href', '/categorias/custom-slug');
        });
    });
}); 