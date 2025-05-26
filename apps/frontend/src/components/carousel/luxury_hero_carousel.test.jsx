import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LuxuryHeroCarousel from './luxury_hero_carousel';

// Mock the API hook
vi.mock('@/api/hooks', () => ({
    useHomepageSlides: vi.fn()
}));

import { useHomepageSlides } from '@/api/hooks';

const mockSlides = [
    {
        id: '1',
        title: 'Test Slide 1',
        subtitle: 'Test Subtitle 1',
        description: 'Test Description 1',
        imageUrl: 'https://example.com/image1.jpg',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        position: 'center'
    },
    {
        id: '2',
        title: 'Test Slide 2',
        subtitle: 'Test Subtitle 2',
        description: 'Test Description 2',
        imageUrl: 'https://example.com/image2.jpg',
        buttonText: 'Learn More',
        buttonLink: '/about',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        position: 'left'
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

const renderWithQueryClient = (component) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            {component}
        </QueryClientProvider>
    );
};

describe('LuxuryHeroCarousel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state correctly', () => {
        useHomepageSlides.mockReturnValue({
            data: [],
            isLoading: true,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        expect(screen.getByText('Loading slides...')).toBeInTheDocument();
        expect(document.querySelector('.loading-skeleton')).toBeInTheDocument();
    });

    it('renders placeholder when no slides available', () => {
        useHomepageSlides.mockReturnValue({
            data: [],
            isLoading: false,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        expect(screen.getByText(/Bienvenido a LUZI.*MARKET/)).toBeInTheDocument();
        expect(screen.getByText('Regalos excepcionales para momentos especiales')).toBeInTheDocument();
    });

    it('renders slides correctly', () => {
        useHomepageSlides.mockReturnValue({
            data: mockSlides,
            isLoading: false,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        expect(screen.getByText('Test Slide 1')).toBeInTheDocument();
        expect(screen.getByText('Test Subtitle 1')).toBeInTheDocument();
        expect(screen.getByText('Test Description 1')).toBeInTheDocument();
        expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });

    it('shows navigation arrows when multiple slides exist', () => {
        useHomepageSlides.mockReturnValue({
            data: mockSlides,
            isLoading: false,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        expect(screen.getByLabelText('Previous slide')).toBeInTheDocument();
        expect(screen.getByLabelText('Next slide')).toBeInTheDocument();
    });

    it('shows slide indicators when multiple slides exist', () => {
        useHomepageSlides.mockReturnValue({
            data: mockSlides,
            isLoading: false,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        const indicators = screen.getAllByLabelText(/Go to slide/);
        expect(indicators).toHaveLength(2);
    });

    it('handles slide navigation correctly', async () => {
        useHomepageSlides.mockReturnValue({
            data: mockSlides,
            isLoading: false,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        // Initially shows first slide
        expect(screen.getByText('Test Slide 1')).toBeInTheDocument();

        // Click next button
        fireEvent.click(screen.getByLabelText('Next slide'));

        await waitFor(() => {
            expect(screen.getByText('Test Slide 2')).toBeInTheDocument();
        });
    });

    it('handles indicator clicks correctly', async () => {
        useHomepageSlides.mockReturnValue({
            data: mockSlides,
            isLoading: false,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        // Click second indicator
        fireEvent.click(screen.getByLabelText('Go to slide 2'));

        await waitFor(() => {
            expect(screen.getByText('Test Slide 2')).toBeInTheDocument();
        });
    });

    it('applies correct text positioning classes', () => {
        useHomepageSlides.mockReturnValue({
            data: [mockSlides[1]], // This slide has position: 'left'
            isLoading: false,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        expect(document.querySelector('.slide-content-left')).toBeInTheDocument();
    });

    it('renders button with correct link', () => {
        useHomepageSlides.mockReturnValue({
            data: [mockSlides[0]],
            isLoading: false,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        const button = screen.getByText('Shop Now');
        expect(button.closest('a')).toHaveAttribute('href', '/products');
    });

    it('handles error state gracefully', () => {
        useHomepageSlides.mockReturnValue({
            data: [],
            isLoading: false,
            error: new Error('Failed to fetch slides')
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        expect(screen.getByText(/Bienvenido a LUZI.*MARKET/)).toBeInTheDocument();
    });

    it('does not show navigation elements for single slide', () => {
        useHomepageSlides.mockReturnValue({
            data: [mockSlides[0]],
            isLoading: false,
            error: null
        });

        renderWithQueryClient(<LuxuryHeroCarousel />);

        expect(screen.queryByLabelText('Previous slide')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Next slide')).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Go to slide/)).not.toBeInTheDocument();
    });
}); 