import React from 'react';
import { renderWithProviders, screen, within } from '@/test-utils';
import { vi } from 'vitest';
vi.unmock('@/components/peticiones/petitioncard');
import PetitionCard from '@/components/peticiones/petitioncard';

describe('PetitionCard', () => {
    it('renders title, badgeCount, description, and link correctly', () => {
        const { container } = renderWithProviders(
            <PetitionCard
                title="Test Title"
                badgeCount={5}
                description="Test description"
                link="/test-link"
            />
        );

        // Use data-testid to find the specific card component
        const card = within(container).getByTestId('petition-card');
        expect(within(card).getByText('Test Title')).toBeInTheDocument();
        expect(within(card).getByText('Test description')).toBeInTheDocument();
        expect(within(card).getByText('5')).toBeInTheDocument();

        // Find the link within the card container
        const link = within(card).getByRole('link', { name: /entrar/i });
        expect(link).toHaveAttribute('href', '/test-link');
    });
}); 