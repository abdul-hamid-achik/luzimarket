import React from 'react';
import { vi } from 'vitest';
vi.unmock('@/components/breadcrumb');
import BreadCrumb from '@/components/breadcrumb';
import { renderWithProviders, screen } from '@/test-utils';

describe('BreadCrumb', () => {
    it('renders items and highlights the active item', () => {
        const items = [
            { name: 'Home', link: '/' },
            { name: 'Dashboard', link: '/dashboard' },
        ];
        renderWithProviders(<BreadCrumb items={items} activeItem="Dashboard" />);
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(2);
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        const activeListItem = screen.getByText('Dashboard').closest('li');
        expect(activeListItem).toHaveClass('active');
    });
}); 