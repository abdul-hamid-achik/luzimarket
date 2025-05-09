import React from 'react';
import { renderWithProviders, screen } from '@/test-utils';
import { vi } from 'vitest';
vi.unmock('@/components/peticiones/petitioncard');
import PetitionCard from '@/components/peticiones/petitioncard';

describe('PetitionCard', () => {
    it('renders title, badgeCount, description, and link correctly', () => {
        renderWithProviders(
            <PetitionCard
                title="Test Title"
                badgeCount={5}
                description="Test description"
                link="/test-link"
            />
        );
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        const link = screen.getByRole('link', { name: /entrar/i });
        expect(link).toHaveAttribute('href', '/test-link');
    });
}); 