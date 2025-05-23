import React from 'react';
import { renderWithProviders, screen, within } from '@/test-utils';
import SuccessAlert from '@/components/alertas/success';

describe('Success Alert Component', () => {
    it('renders a success alert with correct text and close button', () => {
        const { container } = renderWithProviders(<SuccessAlert />);

        // Find the alert specifically within this component's container
        const alert = within(container).getByRole('alert');
        expect(alert).toHaveClass('alert-success');
        expect(within(alert).getByText('A simple success alert')).toBeInTheDocument();

        // Find the button within the alert container
        const button = within(alert).getByRole('button');
        expect(button).toBeInTheDocument();
    });
}); 