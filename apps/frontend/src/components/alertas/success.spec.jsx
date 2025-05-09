import React from 'react';
import { renderWithProviders, screen } from '@/test-utils';
import SuccessAlert from '@/components/alertas/success';

describe('Success Alert Component', () => {
    it('renders a success alert with correct text and close button', () => {
        renderWithProviders(<SuccessAlert />);
        const alert = screen.getByRole('alert');
        expect(alert).toHaveClass('alert-success');
        expect(screen.getByText('A simple success alert')).toBeInTheDocument();
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });
}); 