import React from 'react';
import { vi } from 'vitest';
vi.unmock('@/components/breadcrumb');
import BreadCrumb from '@/components/breadcrumb';
import { renderWithProviders, screen, within } from '@/test-utils';

describe('BreadCrumb', () => {
    it('renders items and highlights the active item', () => {
        const items = [
            { name: 'Home', link: '/' },
            { name: 'Dashboard', link: '/dashboard' },
        ];
        const { container } = renderWithProviders(<BreadCrumb items={items} activeItem="Dashboard" />);

        // Find list items within this component's container only
        const listItems = within(container).getAllByRole('listitem');
        expect(listItems).toHaveLength(2);

        expect(within(container).getByText('Home')).toBeInTheDocument();
        expect(within(container).getByText('Dashboard')).toBeInTheDocument();

        const activeListItem = within(container).getByText('Dashboard').closest('li');
        expect(activeListItem).toHaveClass('active');
    });
}); 