import React from 'react';
import { renderWithProviders, screen } from '@/test-utils';
import DangerAlert from '@/components/alertas/danger';

describe('Danger Alert Component', () => {
    it('renders a danger alert with correct text and close button', () => {
        renderWithProviders(<DangerAlert />);
        const alert = screen.getByRole('alert');
        expect(alert).toHaveClass('alert-danger');
        expect(screen.getByText('A simple danger alert')).toBeInTheDocument();
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });
}); 